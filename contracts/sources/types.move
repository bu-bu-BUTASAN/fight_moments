/// Type definitions for Fight Moments NFT Contract
module fight_moments::types;

use std::string::String;

// ===== Error Codes =====

/// Error code 0: Unauthorized access attempt
/// Triggered when: A non-admin tries to call admin-only functions
/// Functions: All admin module functions requiring AdminCap
#[allow(unused_const)]
const ENotAuthorized: u64 = 0;

/// Error code 1: Invalid moment reference
/// Triggered when: Attempting to operate on a non-existent or invalid moment
/// Functions: Any function taking MintableMoment reference
#[allow(unused_const)]
const EInvalidMoment: u64 = 1;

/// Error code 2: Moment is not active for minting
/// Triggered when: Attempting to mint from a deactivated moment
/// Functions: mint_moment_internal in minting module
/// Solution: Admin must reactivate the moment using reactivate_moment
const EMomentInactive: u64 = 2;

/// Error code 3: No more NFTs available to mint
/// Triggered when: current_supply has reached max_supply limit
/// Functions: mint_moment_internal in minting module
/// Prevention: Check remaining supply with get_remaining_supply before minting
const ESupplyExhausted: u64 = 3;

/// Error code 4: Invalid input parameters
/// Triggered when: Required fields are empty or validation fails
/// Functions: register_moment (empty match_id, moment_type, or URI)
/// Examples: Empty string for match_id, empty URIs, invalid max_supply (0)
const EInvalidInput: u64 = 4;

/// Error code 5: Invalid Walrus URI format
/// Triggered when: URI doesn't match required format or minimum length
/// Functions: register_moment (via validate_walrus_uri)
/// Valid formats: "walrus://xxxxx" (15+ chars) or "https://xx.xx" (14+ chars)
const EInvalidURI: u64 = 5;

/// Error code 6: Royalty percentage exceeds maximum
/// Triggered when: Royalty configuration exceeds MAX_ROYALTY_BPS (20%)
/// Functions: Future royalty configuration functions
/// Maximum allowed: 2000 basis points (20%)
#[allow(unused_const)]
const ERoyaltyTooHigh: u64 = 6;

/// Error code 7: Invalid royalty address
/// Triggered when: BPS > 0 but the corresponding address is unset
#[allow(unused_const)]
const EInvalidRoyaltyAddress: u64 = 7;

// ===== Constants =====

/// Maximum total royalty (20%)
#[allow(unused_const)]
const MAX_ROYALTY_BPS: u16 = 2000;

/// Get maximum royalty basis points
public(package) fun max_royalty_bps(): u16 { MAX_ROYALTY_BPS }

// ===== Error Code Accessors =====

/// Get EMomentInactive error code
public(package) fun e_moment_inactive(): u64 { EMomentInactive }

/// Get ESupplyExhausted error code
public(package) fun e_supply_exhausted(): u64 { ESupplyExhausted }

/// Get EInvalidInput error code
public(package) fun e_invalid_input(): u64 { EInvalidInput }

/// Get EInvalidURI error code
public(package) fun e_invalid_uri(): u64 { EInvalidURI }

/// Get ERoyaltyTooHigh error code
public(package) fun e_royalty_bps_too_high(): u64 { ERoyaltyTooHigh }

/// Get EInvalidRoyaltyAddress error code
public(package) fun e_invalid_royalty_address(): u64 { EInvalidRoyaltyAddress }

// ===== Structs =====

/// Admin capability - required for privileged operations
public struct AdminCap has key, store {
    id: UID
}

/// Walrus media references for efficient storage
public struct WalrusMedia has store, copy, drop {
    video_uri: String,          // walrus://... (main video)
    thumbnail_uri: String,      // walrus://... (for list view)
    blob_id: String,            // Walrus blob identifier
    content_hash: String,       // For verification
}

/// Mintable moment - represents a decisive moment that can be minted as NFT
public struct MintableMoment has key, store {
    id: UID,
    match_id: String,           // Unique match identifier
    fighter_a: String,          // First fighter name
    fighter_b: String,          // Second fighter name
    moment_type: String,        // "KO" | "SUBMISSION" | "DECISION" | "HIGHLIGHT"
    media: WalrusMedia,
    max_supply: u64,            // Maximum number of NFTs that can be minted
    current_supply: u64,        // Number of NFTs minted so far
    creator: address,           // Admin who registered this moment
    is_active: bool,            // Can be minted or not
}

/// Fight Moment NFT - the actual NFT owned by users
public struct FightMomentNFT has key, store {
    id: UID,
    moment_id: ID,              // References MintableMoment
    match_id: String,           // Denormalized for display
    moment_type: String,        // Denormalized for filtering
    fighter_a: String,
    fighter_b: String,
    media: WalrusMedia,
    minted_at: u64,             // Timestamp (milliseconds)
    serial_number: u64,         // 1-indexed within moment
    collection_id: String,      // For marketplace filtering
    creator: address,           // Admin that registered the moment
}

/// Royalty configuration for transfer policy (not enforced in MVP)
public struct RoyaltyConfig has copy, drop, store {
    fighter_a_address: address,
    fighter_a_bps: u16,         // basis points (0-10000)
    fighter_b_address: address,
    fighter_b_bps: u16,
    org_address: address,
    org_bps: u16,
}

/// Helper to construct a RoyaltyConfig
public(package) fun new_royalty_config(
    fighter_a_address: address,
    fighter_a_bps: u16,
    fighter_b_address: address,
    fighter_b_bps: u16,
    org_address: address,
    org_bps: u16,
): RoyaltyConfig {
    RoyaltyConfig {
        fighter_a_address,
        fighter_a_bps,
        fighter_b_address,
        fighter_b_bps,
        org_address,
        org_bps,
    }
}

/// RoyaltyConfig accessors
public fun royalty_fighter_a_bps(config: &RoyaltyConfig): u16 {
    config.fighter_a_bps
}

public fun royalty_fighter_b_bps(config: &RoyaltyConfig): u16 {
    config.fighter_b_bps
}

public fun royalty_org_bps(config: &RoyaltyConfig): u16 {
    config.org_bps
}

// ===== Events =====

/// Emitted when a new moment is registered
public struct MomentRegistered has copy, drop {
    moment_id: ID,
    match_id: String,
    moment_type: String,
    max_supply: u64,
    creator: address,
}

/// Emitted when an NFT is minted
public struct NFTMinted has copy, drop {
    nft_id: ID,
    moment_id: ID,
    minter: address,
    timestamp: u64,
    serial_number: u64,
}

/// Emitted when a moment is deactivated
public struct MomentDeactivated has copy, drop {
    moment_id: ID,
}

/// Emitted when a moment is reactivated
public struct MomentReactivated has copy, drop {
    moment_id: ID,
}

// ===== Event Emitters (package-internal) =====

/// Emit MomentRegistered event
public(package) fun emit_moment_registered(
    moment_id: ID,
    match_id: String,
    moment_type: String,
    max_supply: u64,
    creator: address,
) {
    sui::event::emit(MomentRegistered {
        moment_id,
        match_id,
        moment_type,
        max_supply,
        creator,
    });
}

/// Emit NFTMinted event
public(package) fun emit_nft_minted(
    nft_id: ID,
    moment_id: ID,
    minter: address,
    timestamp: u64,
    serial_number: u64,
) {
    sui::event::emit(NFTMinted {
        nft_id,
        moment_id,
        minter,
        timestamp,
        serial_number,
    });
}

/// Emit MomentDeactivated event
public(package) fun emit_moment_deactivated(moment_id: ID) {
    sui::event::emit(MomentDeactivated {
        moment_id,
    });
}

/// Emit MomentReactivated event
public(package) fun emit_moment_reactivated(moment_id: ID) {
    sui::event::emit(MomentReactivated {
        moment_id,
    });
}

// ===== Accessors for struct fields (package-internal) =====

/// Get mutable reference to current_supply
public(package) fun current_supply_mut(moment: &mut MintableMoment): &mut u64 {
    &mut moment.current_supply
}

/// Get mutable reference to is_active
public(package) fun is_active_mut(moment: &mut MintableMoment): &mut bool {
    &mut moment.is_active
}

/// Get immutable reference to is_active
public(package) fun is_active(moment: &MintableMoment): bool {
    moment.is_active
}

/// Get max_supply
public(package) fun max_supply(moment: &MintableMoment): u64 {
    moment.max_supply
}

/// Get current_supply
public(package) fun current_supply(moment: &MintableMoment): u64 {
    moment.current_supply
}

/// Get media reference
public(package) fun media(moment: &MintableMoment): WalrusMedia {
    moment.media
}

/// Get match_id
public(package) fun match_id(moment: &MintableMoment): String {
    moment.match_id
}

/// Get moment_type
public(package) fun moment_type(moment: &MintableMoment): String {
    moment.moment_type
}

/// Get fighter_a
public(package) fun fighter_a(moment: &MintableMoment): String {
    moment.fighter_a
}

/// Get fighter_b
public(package) fun fighter_b(moment: &MintableMoment): String {
    moment.fighter_b
}

/// Get creator
public(package) fun creator(moment: &MintableMoment): address {
    moment.creator
}

/// Create new AdminCap
public(package) fun new_admin_cap(ctx: &mut TxContext): AdminCap {
    AdminCap {
        id: object::new(ctx)
    }
}

/// Create new MintableMoment
public(package) fun new_mintable_moment(
    match_id: String,
    fighter_a: String,
    fighter_b: String,
    moment_type: String,
    media: WalrusMedia,
    max_supply: u64,
    creator: address,
    ctx: &mut TxContext
): MintableMoment {
    MintableMoment {
        id: object::new(ctx),
        match_id,
        fighter_a,
        fighter_b,
        moment_type,
        media,
        max_supply,
        current_supply: 0,
        creator,
        is_active: true,
    }
}

/// Create new WalrusMedia
public(package) fun new_walrus_media(
    video_uri: String,
    thumbnail_uri: String,
    blob_id: String,
    content_hash: String,
): WalrusMedia {
    WalrusMedia {
        video_uri,
        thumbnail_uri,
        blob_id,
        content_hash,
    }
}

/// Create new FightMomentNFT
public(package) fun new_fight_moment_nft(
    moment_id: ID,
    match_id: String,
    moment_type: String,
    fighter_a: String,
    fighter_b: String,
    media: WalrusMedia,
    minted_at: u64,
    serial_number: u64,
    collection_id: String,
    creator: address,
    ctx: &mut TxContext
): FightMomentNFT {
    FightMomentNFT {
        id: object::new(ctx),
        moment_id,
        match_id,
        moment_type,
        fighter_a,
        fighter_b,
        media,
        minted_at,
        serial_number,
        collection_id,
        creator,
    }
}

/// Get NFT moment_id
public(package) fun nft_moment_id(nft: &FightMomentNFT): ID {
    nft.moment_id
}

/// Get NFT serial_number
public(package) fun nft_serial_number(nft: &FightMomentNFT): u64 {
    nft.serial_number
}

/// Get NFT collection_id
public(package) fun nft_collection_id(nft: &FightMomentNFT): String {
    nft.collection_id
}

public(package) fun nft_creator(nft: &FightMomentNFT): address {
    nft.creator
}

/// Get NFT match_id
public(package) fun nft_match_id(nft: &FightMomentNFT): String {
    nft.match_id
}

/// Get NFT moment_type
public(package) fun nft_moment_type(nft: &FightMomentNFT): String {
    nft.moment_type
}

/// Get NFT fighter_a
public(package) fun nft_fighter_a(nft: &FightMomentNFT): String {
    nft.fighter_a
}

/// Get NFT fighter_b
public(package) fun nft_fighter_b(nft: &FightMomentNFT): String {
    nft.fighter_b
}

/// Get NFT media
public(package) fun nft_media(nft: &FightMomentNFT): WalrusMedia {
    nft.media
}

/// Get NFT minted_at
public(package) fun nft_minted_at(nft: &FightMomentNFT): u64 {
    nft.minted_at
}

/// Get WalrusMedia video_uri
public(package) fun video_uri(media: &WalrusMedia): String {
    media.video_uri
}

/// Get WalrusMedia thumbnail_uri
public(package) fun thumbnail_uri(media: &WalrusMedia): String {
    media.thumbnail_uri
}
