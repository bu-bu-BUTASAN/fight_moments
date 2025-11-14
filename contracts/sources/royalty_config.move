module fight_moments::royalty_config;

use sui::dynamic_field as df;
use sui::transfer_policy;
use sui::transfer_policy::{TransferPolicy, TransferPolicyCap};
use fight_moments::types::{FightMomentNFT, RoyaltyConfig};

public struct RoyaltyMetadataKey has copy, drop, store {}

public fun store_config(
    policy: &mut TransferPolicy<FightMomentNFT>,
    cap: &TransferPolicyCap<FightMomentNFT>,
    config: RoyaltyConfig,
) {
    let parent = transfer_policy::uid_mut_as_owner(policy, cap);

    let remove_key = RoyaltyMetadataKey {};
    let _: std::option::Option<RoyaltyConfig> = df::remove_if_exists(parent, remove_key);

    let add_key = RoyaltyMetadataKey {};
    df::add(parent, add_key, config);
}

public fun get_config(policy: &TransferPolicy<FightMomentNFT>): std::option::Option<RoyaltyConfig> {
    let parent = transfer_policy::uid(policy);
    let key = RoyaltyMetadataKey {};

    if (!df::exists_(parent, key)) {
        std::option::none()
    } else {
        std::option::some(*df::borrow(parent, key))
    }
}
