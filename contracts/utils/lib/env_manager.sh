#!/bin/bash
# env_manager.sh - 環境変数管理ライブラリ

# グローバル変数
ENV_DIR=""
ENV_TEMPLATE=""

# 環境変数管理の初期化
# 引数:
#   $1 - 環境変数ディレクトリのパス
initialize_env_manager() {
    ENV_DIR="$1"
    ENV_TEMPLATE="${ENV_DIR}/.env.template"

    # 環境変数ディレクトリが存在しない場合は作成
    if [[ ! -d "$ENV_DIR" ]]; then
        mkdir -p "$ENV_DIR"
    fi
}

# 環境変数ファイルのパスを取得
# 引数:
#   $1 - ネットワーク名
# 戻り値:
#   環境変数ファイルのパス
get_env_file_path() {
    local network="$1"
    echo "${ENV_DIR}/.env.${network}"
}

# 環境変数ファイルを読み込み
# 引数:
#   $1 - ネットワーク名
# 戻り値:
#   0 - 成功、1 - 失敗
load_env_file() {
    local network="$1"
    local env_file=$(get_env_file_path "$network")

    # 環境変数ファイルが存在しない場合はテンプレートから作成
    if [[ ! -f "$env_file" ]]; then
        log_warning "環境変数ファイルが見つかりません: ${env_file}"

        if [[ -f "$ENV_TEMPLATE" ]]; then
            log_info "テンプレートから環境変数ファイルを作成します..."
            if create_env_from_template "$network"; then
                log_success "環境変数ファイルを作成しました: ${env_file}"
            else
                log_error "環境変数ファイルの作成に失敗しました。"
                return 1
            fi
        else
            log_error "テンプレートファイルが見つかりません: ${ENV_TEMPLATE}"
            return 1
        fi
    fi

    # 環境変数ファイルを読み込み
    log_info "環境変数ファイルを読み込んでいます: ${env_file}"

    # shellcheck source=/dev/null
    if source "$env_file"; then
        log_success "環境変数ファイルを読み込みました。"
        return 0
    else
        log_error "環境変数ファイルの読み込みに失敗しました。"
        return 1
    fi
}

# 環境変数ファイルを更新
# 引数:
#   $1 - ネットワーク名
#   $2 - キー
#   $3 - 値
# 戻り値:
#   0 - 成功、1 - 失敗
update_env_file() {
    local network="$1"
    local key="$2"
    local value="$3"
    local env_file=$(get_env_file_path "$network")

    # 環境変数ファイルが存在しない場合は作成
    if [[ ! -f "$env_file" ]]; then
        log_warning "環境変数ファイルが見つかりません。作成します..."
        if ! create_env_from_template "$network"; then
            log_error "環境変数ファイルの作成に失敗しました。"
            return 1
        fi
    fi

    # キーが既に存在する場合は更新、存在しない場合は追加
    if grep -q "^${key}=" "$env_file"; then
        # 既存のキーを更新（macOS対応のため -i ''を使用）
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
        log_info "${key} を更新しました。"
    else
        # 新しいキーを追加
        echo "${key}=${value}" >> "$env_file"
        log_info "${key} を追加しました。"
    fi

    return 0
}

# 複数の環境変数を一括更新
# 引数:
#   $1 - ネットワーク名
#   $2 - 連想配列名（キーと値のペア）
# 戻り値:
#   0 - 成功、1 - 失敗
update_env_file_bulk() {
    local network="$1"
    shift
    local -n env_vars=$1

    log_info "環境変数ファイルを一括更新しています..."

    # バックアップを作成
    if ! backup_env_file "$network"; then
        log_warning "バックアップの作成に失敗しましたが、続行します。"
    fi

    # 各環境変数を更新
    for key in "${!env_vars[@]}"; do
        local value="${env_vars[$key]}"
        if ! update_env_file "$network" "$key" "$value"; then
            log_error "${key} の更新に失敗しました。"
            return 1
        fi
    done

    log_success "環境変数ファイルを一括更新しました。"
    return 0
}

# 環境変数ファイルのバックアップ
# 引数:
#   $1 - ネットワーク名
# 戻り値:
#   0 - 成功、1 - 失敗
backup_env_file() {
    local network="$1"
    local env_file=$(get_env_file_path "$network")

    # 環境変数ファイルが存在しない場合はスキップ
    if [[ ! -f "$env_file" ]]; then
        return 0
    fi

    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="${env_file}.backup.${timestamp}"

    if cp "$env_file" "$backup_file"; then
        log_info "バックアップを作成しました: ${backup_file}"
        return 0
    else
        log_error "バックアップの作成に失敗しました。"
        return 1
    fi
}

# テンプレートから環境変数ファイルを作成
# 引数:
#   $1 - ネットワーク名
# 戻り値:
#   0 - 成功、1 - 失敗
create_env_from_template() {
    local network="$1"
    local env_file=$(get_env_file_path "$network")

    # テンプレートファイルが存在しない場合はエラー
    if [[ ! -f "$ENV_TEMPLATE" ]]; then
        log_error "テンプレートファイルが見つかりません: ${ENV_TEMPLATE}"
        return 1
    fi

    # テンプレートをコピー
    if cp "$ENV_TEMPLATE" "$env_file"; then
        # ネットワーク名とRPC URLを設定
        case "$network" in
            devnet)
                update_env_file "$network" "NETWORK" "devnet"
                update_env_file "$network" "RPC_URL" "https://fullnode.devnet.sui.io:443"
                ;;
            testnet)
                update_env_file "$network" "NETWORK" "testnet"
                update_env_file "$network" "RPC_URL" "https://fullnode.testnet.sui.io:443"
                ;;
            local)
                update_env_file "$network" "NETWORK" "local"
                update_env_file "$network" "RPC_URL" "http://127.0.0.1:9000"
                ;;
        esac

        # アクティブアドレスを設定
        if [[ -n "$CURRENT_ADDRESS" ]]; then
            update_env_file "$network" "ACTIVE_ADDRESS" "$CURRENT_ADDRESS"
        fi

        return 0
    else
        log_error "環境変数ファイルの作成に失敗しました。"
        return 1
    fi
}

# 環境変数ファイルの内容を表示
# 引数:
#   $1 - ネットワーク名
show_env_file() {
    local network="$1"
    local env_file=$(get_env_file_path "$network")

    if [[ ! -f "$env_file" ]]; then
        log_error "環境変数ファイルが見つかりません: ${env_file}"
        return 1
    fi

    log_section "環境変数 (${network})"
    cat "$env_file"
    echo ""
}

# 環境変数の値を取得
# 引数:
#   $1 - ネットワーク名
#   $2 - キー
# 戻り値:
#   環境変数の値（見つからない場合は空文字）
get_env_value() {
    local network="$1"
    local key="$2"
    local env_file=$(get_env_file_path "$network")

    if [[ ! -f "$env_file" ]]; then
        echo ""
        return 1
    fi

    local value=$(grep "^${key}=" "$env_file" | cut -d'=' -f2-)
    echo "$value"
}
