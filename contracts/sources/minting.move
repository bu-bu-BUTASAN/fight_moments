/// Core minting logic for Fight Moments NFT Contract
module fight_moments::minting;

use std::string::{Self, String};
use sui::clock::{Self, Clock};
use fight_moments::types::{
Self,
MintableMoment,
FightMomentNFT
};

/// Minimum length for Walrus URI: "walrus://xxxxx" (15 characters minimum)
const MIN_WALRUS_URI_LENGTH: u64 = 15;

/// Minimum length for HTTPS URI: "https://xx.xx" (14 characters minimum)
const MIN_HTTPS_URI_LENGTH: u64 = 14;

/// Validate Walrus URI format
/// Returns true if URI starts with "walrus://" or "https://" and meets minimum length requirements
/// Minimum lengths ensure URIs contain actual content, not just the prefix
public(package) fun validate_walrus_uri(uri: &String): bool {
    // Check if URI starts with "walrus://" or "https://"
    let uri_bytes = string::as_bytes(uri);
    let len = std::vector::length(uri_bytes);

    // Early return if URI is too short for any valid format
    if (len < MIN_HTTPS_URI_LENGTH) return false;

    // Check for "walrus://" (9 characters)
    let mut is_walrus = true;
    let walrus_prefix = b"walrus://";
    let mut i = 0;
    while (i < 9) {
        if (*std::vector::borrow(uri_bytes, i) != *std::vector::borrow(&walrus_prefix, i)) {
            is_walrus = false;
            break
        };
        i = i + 1;
    };

    // If walrus URI, check minimum length
    if (is_walrus) {
        return len >= MIN_WALRUS_URI_LENGTH
    };

    // Check for "https://" (8 characters)
    let https_prefix = b"https://";
    let mut is_https = true;
    i = 0;
    while (i < 8) {
        if (*std::vector::borrow(uri_bytes, i) != *std::vector::borrow(&https_prefix, i)) {
            is_https = false;
            break
        };
        i = i + 1;
    };

    // If https URI, check minimum length
    if (is_https) {
        return len >= MIN_HTTPS_URI_LENGTH
    };

    false
}

/// Internal function to create an NFT
/// Validates moment is active and supply is not exhausted
/// Increments supply and returns new NFT
public(package) fun mint_moment_internal(
    moment: &mut MintableMoment,
    clock: &Clock,
    ctx: &mut TxContext
): FightMomentNFT {
    // Validate moment is active
    assert!(types::is_active(moment), types::e_moment_inactive());
    
    // Validate supply is not exhausted
    assert!(types::current_supply(moment) < types::max_supply(moment), types::e_supply_exhausted());

    // Increment supply
    let current_supply_ref = types::current_supply_mut(moment);
    *current_supply_ref = *current_supply_ref + 1;
    let serial_number = *current_supply_ref;

    // Create NFT with denormalized metadata
    let nft = types::new_fight_moment_nft(
        object::id(moment),
        types::match_id(moment),
        types::moment_type(moment),
        types::fighter_a(moment),
        types::fighter_b(moment),
        types::media(moment),
        clock::timestamp_ms(clock),
        serial_number,
        string::utf8(b"fight_moments_v1"),
        types::creator(moment),
        ctx
    );

    // Emit event
    types::emit_nft_minted(
        object::id(&nft),
        object::id(moment),
        tx_context::sender(ctx),
        types::nft_minted_at(&nft),
        serial_number,
    );

    nft
}
