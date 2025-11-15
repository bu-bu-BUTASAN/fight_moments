#!/bin/bash
# cli.sh - Fight Moments CLI エントリーポイント

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# main.sh の存在確認
MAIN_SCRIPT="${SCRIPT_DIR}/main.sh"

if [[ ! -f "$MAIN_SCRIPT" ]]; then
    echo "Error: main.sh が見つかりません: ${MAIN_SCRIPT}"
    exit 1
fi

# main.sh を実行
bash "$MAIN_SCRIPT"
