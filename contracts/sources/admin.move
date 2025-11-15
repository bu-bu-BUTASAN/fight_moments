/// Admin functions for Fight Moments NFT Contract
/// All functions requiring AdminCap are defined here
module fight_moments::admin;

use std::string::{Self, String};
use fight_moments::types::{
    Self,
    AdminCap,
    FightMomentNFT,
    MintableMoment
};
use fight_moments::minting;
use fight_moments::royalty_config;
use sui::transfer_policy::{TransferPolicy, TransferPolicyCap};

/// Register a new mintable moment
/// Only admin can call this function
entry fun register_moment(
    _admin_cap: &AdminCap,
    match_id: String,
    fighter_a: String,
    fighter_b: String,
    moment_type: String,
    video_uri: String,
    thumbnail_uri: String,
    blob_id: String,
    video_blob_id: String,
    thumbnail_blob_id: String,
    content_hash: String,
    max_supply: u64,
    ctx: &mut TxContext
) {
    // Validate inputs
    assert!(!string::is_empty(&match_id), types::e_invalid_input());
    assert!(!string::is_empty(&fighter_a), types::e_invalid_input());
    assert!(!string::is_empty(&fighter_b), types::e_invalid_input());
    assert!(!string::is_empty(&moment_type), types::e_invalid_input());
    assert!(minting::validate_walrus_uri(&video_uri), types::e_invalid_uri());
    assert!(minting::validate_walrus_uri(&thumbnail_uri), types::e_invalid_uri());
    assert!(max_supply > 0, types::e_invalid_input());

    // Create WalrusMedia
    let media = types::new_walrus_media(
        video_uri,
        thumbnail_uri,
        blob_id,
        video_blob_id,
        thumbnail_blob_id,
        content_hash
    );

    // Create MintableMoment
    let moment = types::new_mintable_moment(
        match_id,
        fighter_a,
        fighter_b,
        moment_type,
        media,
        max_supply,
        tx_context::sender(ctx),
        ctx
    );

    // Emit event
    types::emit_moment_registered(
        object::id(&moment),
        types::match_id(&moment),
        types::moment_type(&moment),
        max_supply,
        types::creator(&moment),
    );

    // Share the moment object
    transfer::public_share_object(moment);
}

/// Deactivate a moment (prevents new mints)
public fun deactivate_moment(
    _admin_cap: &AdminCap,
    moment: &mut MintableMoment,
) {
    let is_active_ref = types::is_active_mut(moment);
    *is_active_ref = false;

    types::emit_moment_deactivated(object::id(moment));
}

/// Reactivate a moment (allows minting again)
public fun reactivate_moment(
    _admin_cap: &AdminCap,
    moment: &mut MintableMoment,
) {
    let is_active_ref = types::is_active_mut(moment);
    *is_active_ref = true;

    types::emit_moment_reactivated(object::id(moment));
}

entry fun set_royalty_config(
    _admin_cap: &AdminCap,
    policy: &mut TransferPolicy<FightMomentNFT>,
    policy_cap: &TransferPolicyCap<FightMomentNFT>,
    fighter_a_address: address,
    fighter_a_bps: u16,
    fighter_b_address: address,
    fighter_b_bps: u16,
    org_address: address,
    org_bps: u16,
) {
    validate_royalty_address(fighter_a_address, fighter_a_bps);
    validate_royalty_address(fighter_b_address, fighter_b_bps);
    validate_royalty_address(org_address, org_bps);

    let total_bps = fighter_a_bps + fighter_b_bps + org_bps;
    assert!(total_bps <= types::max_royalty_bps(), types::e_royalty_bps_too_high());

    let config = types::new_royalty_config(
        fighter_a_address,
        fighter_a_bps,
        fighter_b_address,
        fighter_b_bps,
        org_address,
        org_bps,
    );

    royalty_config::store_config(policy, policy_cap, config);
}

fun validate_royalty_address(address: address, bps: u16) {
    if (bps > 0) {
        assert!(address != @0x0, types::e_invalid_royalty_address());
    }
}
