/// Public accessor functions for Fight Moments NFT Contract
/// All public functions and getters are defined here
module fight_moments::accessor;

use std::string::String;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::clock::Clock;
use sui::transfer_policy::TransferPolicy;
use fight_moments::types::{
    Self,
    MintableMoment,
    FightMomentNFT,
    WalrusMedia
};
use fight_moments::minting;
use fight_moments::registry::{Self, MomentRegistry};

// ===== User Minting Functions =====

/// Mint an NFT and lock it in user's Kiosk
entry fun mint_and_lock(
    moment_registry: &mut MomentRegistry,
    moment: &mut MintableMoment,
    kiosk: &mut Kiosk,
    kiosk_cap: &KioskOwnerCap,
    policy: &TransferPolicy<FightMomentNFT>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let nft = minting::mint_moment_internal(moment, clock, ctx);
    kiosk::lock(kiosk, kiosk_cap, policy, nft);

    // Update registry supply
    let moment_id = object::id(moment);
    let current_supply = types::current_supply(moment);
    registry::update_moment_supply(moment_registry, moment_id, current_supply);
}

/// Create a new Kiosk and mint an NFT (for first-time users)
#[allow(lint(self_transfer))]
entry fun create_kiosk_and_mint(
    moment_registry: &mut MomentRegistry,
    moment: &mut MintableMoment,
    policy: &TransferPolicy<FightMomentNFT>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Create new Kiosk
    let (mut kiosk, kiosk_cap) = kiosk::new(ctx);

    // Mint NFT
    let nft = minting::mint_moment_internal(moment, clock, ctx);

    // Lock NFT in Kiosk
    kiosk::lock(&mut kiosk, &kiosk_cap, policy, nft);

    // Update registry supply
    let moment_id = object::id(moment);
    let current_supply = types::current_supply(moment);
    registry::update_moment_supply(moment_registry, moment_id, current_supply);

    // Transfer Kiosk ownership to user
    transfer::public_share_object(kiosk);
    transfer::public_transfer(kiosk_cap, tx_context::sender(ctx));
}

// ===== Public Getters =====

/// Get moment metadata
/// Returns: (match_id, fighter_a, fighter_b, moment_type, media, max_supply, current_supply, is_active)
public fun get_moment_metadata(moment: &MintableMoment): (String, String, String, String, WalrusMedia, u64, u64, bool) {
    (
        types::match_id(moment),
        types::fighter_a(moment),
        types::fighter_b(moment),
        types::moment_type(moment),
        types::media(moment),
        types::max_supply(moment),
        types::current_supply(moment),
        types::is_active(moment)
    )
}

/// Get max supply for a moment
public fun get_max_supply(moment: &MintableMoment): u64 {
    types::max_supply(moment)
}

/// Get current supply for a moment
public fun get_current_supply(moment: &MintableMoment): u64 {
    types::current_supply(moment)
}

/// Get remaining supply for a moment
public fun get_remaining_supply(moment: &MintableMoment): u64 {
    types::max_supply(moment) - types::current_supply(moment)
}

/// Get NFT metadata
/// Returns: (moment_id, match_id, moment_type, fighter_a, fighter_b, media, minted_at, serial_number, collection_id, creator)
public fun get_nft_metadata(nft: &FightMomentNFT): (ID, String, String, String, String, WalrusMedia, u64, u64, String, address) {
    (
        types::nft_moment_id(nft),
        types::nft_match_id(nft),
        types::nft_moment_type(nft),
        types::nft_fighter_a(nft),
        types::nft_fighter_b(nft),
        types::nft_media(nft),
        types::nft_minted_at(nft),
        types::nft_serial_number(nft),
        types::nft_collection_id(nft),
        types::nft_creator(nft)
    )
}

/// Get collection ID from NFT
public fun get_collection_id(nft: &FightMomentNFT): String {
    types::nft_collection_id(nft)
}

/// Get NFT creator
public fun get_nft_creator(nft: &FightMomentNFT): address {
    types::nft_creator(nft)
}

/// Get moment ID from NFT
public fun get_moment_id(nft: &FightMomentNFT): ID {
    types::nft_moment_id(nft)
}

/// Get serial number from NFT
public fun get_serial_number(nft: &FightMomentNFT): u64 {
    types::nft_serial_number(nft)
}
