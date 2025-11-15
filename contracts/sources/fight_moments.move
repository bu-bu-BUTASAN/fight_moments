/// Fight Moments NFT Contract
///
/// Main module for Fight Moments NFT system.
/// This module handles initialization and Object Display setup.
///
/// Module structure:
/// - types.move: Type definitions (structs, events, error codes)
/// - minting.move: Core minting logic (validation, NFT creation)
/// - admin.move: Admin-only functions (require AdminCap)
/// - accessor.move: Public functions and getters for users
module fight_moments::fight_moments;

use std::string;
use sui::package;
use sui::display;
use sui::transfer_policy;
use fight_moments::types::{Self, FightMomentNFT};
use fight_moments::registry;

// ===== One-time Witness =====

/// One-time witness for package initialization
public struct FIGHT_MOMENTS has drop {}

// ===== Initialization =====

/// Initialize the contract
/// Creates AdminCap, Publisher, TransferPolicy, and MomentRegistry
#[allow(lint(share_owned))]
fun init(otw: FIGHT_MOMENTS, ctx: &mut TxContext) {
    // Create and transfer AdminCap to deployer
    let admin_cap = types::new_admin_cap(ctx);
    transfer::public_transfer(admin_cap, tx_context::sender(ctx));

    // Create Publisher for Object Display
    let publisher = package::claim(otw, ctx);

    // Create TransferPolicy for future royalty enforcement
    let (policy, policy_cap) = transfer_policy::new<FightMomentNFT>(&publisher, ctx);

    // Share the transfer policy (required for Kiosk)
    transfer::public_share_object(policy);

    // Transfer policy cap to deployer
    transfer::public_transfer(policy_cap, tx_context::sender(ctx));

    // Create and share MomentRegistry for managing mintable moments
    let moment_registry = registry::create_registry(ctx);
    registry::share_registry(moment_registry);

    // Setup Object Display
    setup_display(&publisher, ctx);

    // Transfer publisher to deployer
    transfer::public_transfer(publisher, tx_context::sender(ctx));
}

/// Setup Object Display template for NFT metadata
#[allow(lint(self_transfer))]
fun setup_display(publisher: &package::Publisher, ctx: &mut TxContext) {
    let mut display = display::new<FightMomentNFT>(publisher, ctx);
    
    display::add(&mut display, string::utf8(b"name"), string::utf8(b"Fight Moment #{match_id} - {moment_type}"));
    display::add(&mut display, string::utf8(b"description"), string::utf8(b"{fighter_a} vs {fighter_b}"));
    display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{media.thumbnail_blob_id}"));
    display::add(&mut display, string::utf8(b"animation_url"), string::utf8(b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{media.video_blob_id}"));
    display::add(&mut display, string::utf8(b"project_url"), string::utf8(b"https://fightmoments.xyz"));
    display::add(&mut display, string::utf8(b"collection_id"), string::utf8(b"{collection_id}"));
    
    display::update_version(&mut display);
    transfer::public_share_object(display);
}

// ===== Test-only Functions =====

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(FIGHT_MOMENTS {}, ctx);
}
