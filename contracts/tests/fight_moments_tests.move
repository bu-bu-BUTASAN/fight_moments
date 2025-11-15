/// Comprehensive tests for Fight Moments NFT Contract
#[test_only]
module fight_moments::fight_moments_tests;

use sui::test_scenario::{Self as ts, Scenario};
use sui::clock::{Self};
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
use sui::transfer_policy::{TransferPolicy, TransferPolicyCap};
use fight_moments::fight_moments::{Self};
use fight_moments::types::{
    AdminCap,
    MintableMoment,
    FightMomentNFT,
    royalty_fighter_a_bps,
    royalty_fighter_b_bps,
    royalty_org_bps,
};
use fight_moments::admin;
use fight_moments::accessor;
use fight_moments::minting;
use fight_moments::royalty_config;
use std::string::{Self};

// Test addresses
const ADMIN: address = @0xAD;
const USER1: address = @0x1;
const USER2: address = @0x2;

// Helper function to initialize the contract
fun init_contract(scenario: &mut Scenario) {
    ts::next_tx(scenario, ADMIN);
    {
        fight_moments::init_for_testing(ts::ctx(scenario));
    };
}

// Helper function to register a test moment
fun register_test_moment(scenario: &mut Scenario): ID {
    ts::next_tx(scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(scenario);
    
    admin::register_moment(
        &admin_cap,
        string::utf8(b"MATCH001"),
        string::utf8(b"Fighter A"),
        string::utf8(b"Fighter B"),
        string::utf8(b"KO"),
        string::utf8(b"walrus://video123"),
        string::utf8(b"walrus://thumb123"),
        string::utf8(b"blob123"),
        string::utf8(b"video_blob_123"),
        string::utf8(b"thumb_blob_123"),
        string::utf8(b"hash123"),
        100,
        ts::ctx(scenario)
    );
    
    ts::return_to_sender(scenario, admin_cap);
    
    ts::next_tx(scenario, ADMIN);
    let moment = ts::take_shared<MintableMoment>(scenario);
    let moment_id = object::id(&moment);
    ts::return_shared(moment);
    
    moment_id
}

#[test]
fun test_initialization() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        // Verify AdminCap was created
        assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        
        // Verify TransferPolicy was created
        assert!(ts::has_most_recent_shared<TransferPolicy<FightMomentNFT>>(), 1);
        
        // Verify TransferPolicyCap was created
        assert!(ts::has_most_recent_for_sender<TransferPolicyCap<FightMomentNFT>>(&scenario), 2);
    };
    
    ts::end(scenario);
}

#[test]
fun test_set_royalty_config_success() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let policy_cap = ts::take_from_sender<TransferPolicyCap<FightMomentNFT>>(&scenario);
        let mut policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);

        admin::set_royalty_config(
            &admin_cap,
            &mut policy,
            &policy_cap,
            @0xF1,
            500,
            @0xF2,
            500,
            @0xF3,
            200,
        );

        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, ADMIN);
        ts::return_to_sender(&scenario, admin_cap);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let config_opt = royalty_config::get_config(&policy);
        assert!(std::option::is_some(&config_opt), 0);
        let config = std::option::destroy_some(config_opt);
        assert!(royalty_fighter_a_bps(&config) == 500, 1);
        assert!(royalty_fighter_b_bps(&config) == 500, 2);
        assert!(royalty_org_bps(&config) == 200, 3);
        ts::return_shared(policy);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(location = admin, abort_code = 6)]
fun test_set_royalty_config_exceeds_bps() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let policy_cap = ts::take_from_sender<TransferPolicyCap<FightMomentNFT>>(&scenario);
        let mut policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);

        admin::set_royalty_config(
            &admin_cap,
            &mut policy,
            &policy_cap,
            @0xF1,
            1000,
            @0xF2,
            1000,
            @0xF3,
            1000,
        );

        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, ADMIN);
        ts::return_to_sender(&scenario, admin_cap);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(location = admin, abort_code = 7)]
fun test_set_royalty_config_invalid_address() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let policy_cap = ts::take_from_sender<TransferPolicyCap<FightMomentNFT>>(&scenario);
        let mut policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);

        admin::set_royalty_config(
            &admin_cap,
            &mut policy,
            &policy_cap,
            @0x0,
            500,
            @0xF2,
            500,
            @0xF3,
            500,
        );

        transfer::public_share_object(policy);
        transfer::public_transfer(policy_cap, ADMIN);
        ts::return_to_sender(&scenario, admin_cap);
    };

    ts::end(scenario);
}

#[test]
fun test_register_moment_success() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    
    let moment_id = register_test_moment(&mut scenario);
    
    ts::next_tx(&mut scenario, USER1);
    {
        let moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        
        // Verify moment data
        let (match_id, fighter_a, fighter_b, moment_type, _media, max_supply, current_supply, is_active) 
            = accessor::get_moment_metadata(&moment);
        
        assert!(match_id == string::utf8(b"MATCH001"), 0);
        assert!(fighter_a == string::utf8(b"Fighter A"), 1);
        assert!(fighter_b == string::utf8(b"Fighter B"), 2);
        assert!(moment_type == string::utf8(b"KO"), 3);
        assert!(max_supply == 100, 4);
        assert!(current_supply == 0, 5);
        assert!(is_active == true, 6);
        
        ts::return_shared(moment);
    };
    
    ts::end(scenario);
}

#[test]
fun test_deactivate_and_reactivate_moment() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    let moment_id = register_test_moment(&mut scenario);
    
    // Deactivate moment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        
        admin::deactivate_moment(&admin_cap, &mut moment);
        
        let (_match_id, _fighter_a, _fighter_b, _moment_type, _media, _max_supply, _current_supply, is_active) 
            = accessor::get_moment_metadata(&moment);
        assert!(is_active == false, 0);
        
        ts::return_to_sender(&scenario, admin_cap);
        ts::return_shared(moment);
    };
    
    // Reactivate moment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        
        admin::reactivate_moment(&admin_cap, &mut moment);
        
        let (_match_id, _fighter_a, _fighter_b, _moment_type, _media, _max_supply, _current_supply, is_active) 
            = accessor::get_moment_metadata(&moment);
        assert!(is_active == true, 1);
        
        ts::return_to_sender(&scenario, admin_cap);
        ts::return_shared(moment);
    };
    
    ts::end(scenario);
}

#[test]
fun test_create_kiosk_and_mint() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    let moment_id = register_test_moment(&mut scenario);
    
    // User1 creates Kiosk and mints
    ts::next_tx(&mut scenario, USER1);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);
        
        accessor::create_kiosk_and_mint(
            &mut moment,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        // Verify supply increased
        let remaining = accessor::get_remaining_supply(&moment);
        assert!(remaining == 99, 0);
        
        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(policy);
    };
    
    // Verify Kiosk and KioskOwnerCap were created
    ts::next_tx(&mut scenario, USER1);
    {
        assert!(ts::has_most_recent_shared<Kiosk>(), 1);
        assert!(ts::has_most_recent_for_sender<KioskOwnerCap>(&scenario), 2);
    };
    
    ts::end(scenario);
}

#[test]
fun test_mint_to_existing_kiosk() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    let moment_id = register_test_moment(&mut scenario);
    
    // User1 creates Kiosk first
    ts::next_tx(&mut scenario, USER1);
    {
        let (kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));
        transfer::public_share_object(kiosk);
        transfer::public_transfer(kiosk_cap, USER1);
    };
    
    // User1 mints to existing Kiosk
    ts::next_tx(&mut scenario, USER1);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let mut kiosk = ts::take_shared<Kiosk>(&scenario);
        let kiosk_cap = ts::take_from_sender<KioskOwnerCap>(&scenario);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 2000);
        
        accessor::mint_and_lock(
            &mut moment,
            &mut kiosk,
            &kiosk_cap,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        let remaining = accessor::get_remaining_supply(&moment);
        assert!(remaining == 99, 0);
        
        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(kiosk);
        ts::return_to_sender(&scenario, kiosk_cap);
        ts::return_shared(policy);
    };
    
    ts::end(scenario);
}

#[test]
#[expected_failure(location = minting, abort_code = 2)] // EMomentInactive
fun test_mint_from_inactive_moment() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    let moment_id = register_test_moment(&mut scenario);
    
    // Deactivate moment
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        
        admin::deactivate_moment(&admin_cap, &mut moment);
        
        ts::return_to_sender(&scenario, admin_cap);
        ts::return_shared(moment);
    };
    
    // Try to mint (should fail)
    ts::next_tx(&mut scenario, USER1);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        accessor::create_kiosk_and_mint(
            &mut moment,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(policy);
    };
    
    ts::end(scenario);
}

#[test]
fun test_multiple_mints() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    let moment_id = register_test_moment(&mut scenario);
    
    // User1 mints
    ts::next_tx(&mut scenario, USER1);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);
        
        accessor::create_kiosk_and_mint(
            &mut moment,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        let remaining = accessor::get_remaining_supply(&moment);
        assert!(remaining == 99, 0);
        
        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(policy);
    };
    
    // User2 mints
    ts::next_tx(&mut scenario, USER2);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 2000);
        
        accessor::create_kiosk_and_mint(
            &mut moment,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        let remaining = accessor::get_remaining_supply(&moment);
        assert!(remaining == 98, 1);
        
        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(policy);
    };
    
    ts::end(scenario);
}

#[test]
fun test_remaining_supply() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);
    
    // Register moment with max_supply = 3
    ts::next_tx(&mut scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
    
    admin::register_moment(
        &admin_cap,
        string::utf8(b"MATCH002"),
        string::utf8(b"Fighter C"),
        string::utf8(b"Fighter D"),
        string::utf8(b"SUBMISSION"),
        string::utf8(b"walrus://video456"),
        string::utf8(b"walrus://thumb456"),
        string::utf8(b"blob456"),
        string::utf8(b"video_blob_456"),
        string::utf8(b"thumb_blob_456"),
        string::utf8(b"hash456"),
        3,
        ts::ctx(&mut scenario)
    );
    
    ts::return_to_sender(&scenario, admin_cap);
    
    ts::next_tx(&mut scenario, ADMIN);
    let moment = ts::take_shared<MintableMoment>(&scenario);
    let moment_id = object::id(&moment);
    ts::return_shared(moment);
    
    // Mint 3 times
    let mut i = 0;
    while (i < 3) {
        ts::next_tx(&mut scenario, USER1);
        {
            let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
            let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000 * (i + 1));
            
            let (mut kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));
            
            accessor::mint_and_lock(
                &mut moment,
                &mut kiosk,
                &kiosk_cap,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            let remaining = accessor::get_remaining_supply(&moment);
            assert!(remaining == 3 - i - 1, i);
            
            clock::destroy_for_testing(clock);
            transfer::public_share_object(kiosk);
            transfer::public_transfer(kiosk_cap, USER1);
            ts::return_shared(moment);
            ts::return_shared(policy);
        };
        i = i + 1;
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(location = minting, abort_code = 3)] // ESupplyExhausted
fun test_mint_supply_exhausted() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    // Register moment with max_supply = 2
    ts::next_tx(&mut scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

    admin::register_moment(
        &admin_cap,
        string::utf8(b"MATCH003"),
        string::utf8(b"Fighter E"),
        string::utf8(b"Fighter F"),
        string::utf8(b"TKO"),
        string::utf8(b"walrus://video789"),
        string::utf8(b"walrus://thumb789"),
        string::utf8(b"blob789"),
        string::utf8(b"video_blob_789"),
        string::utf8(b"thumb_blob_789"),
        string::utf8(b"hash789"),
        2,
        ts::ctx(&mut scenario)
    );

    ts::return_to_sender(&scenario, admin_cap);

    ts::next_tx(&mut scenario, ADMIN);
    let moment = ts::take_shared<MintableMoment>(&scenario);
    let moment_id = object::id(&moment);
    ts::return_shared(moment);

    // Mint 2 times (exhaust supply)
    let mut i = 0;
    while (i < 2) {
        ts::next_tx(&mut scenario, USER1);
        {
            let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
            let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
            let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
            clock::set_for_testing(&mut clock, 1000 * (i + 1));

            let (mut kiosk, kiosk_cap) = kiosk::new(ts::ctx(&mut scenario));

            accessor::mint_and_lock(
                &mut moment,
                &mut kiosk,
                &kiosk_cap,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            transfer::public_share_object(kiosk);
            transfer::public_transfer(kiosk_cap, USER1);
            ts::return_shared(moment);
            ts::return_shared(policy);
        };
        i = i + 1;
    };

    // Try to mint the 3rd time (should fail with ESupplyExhausted)
    ts::next_tx(&mut scenario, USER2);
    {
        let mut moment = ts::take_shared_by_id<MintableMoment>(&scenario, moment_id);
        let policy = ts::take_shared<TransferPolicy<FightMomentNFT>>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 3000);

        accessor::create_kiosk_and_mint(
            &mut moment,
            &policy,
            &clock,
            ts::ctx(&mut scenario)
        );

        clock::destroy_for_testing(clock);
        ts::return_shared(moment);
        ts::return_shared(policy);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(location = admin, abort_code = 5)] // EInvalidURI
fun test_register_invalid_uri() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

    // Try to register moment with invalid URI format (should fail)
    admin::register_moment(
        &admin_cap,
        string::utf8(b"MATCH004"),
        string::utf8(b"Fighter G"),
        string::utf8(b"Fighter H"),
        string::utf8(b"DECISION"),
        string::utf8(b"invalid://video"),  // Invalid URI scheme
        string::utf8(b"walrus://thumb999"),
        string::utf8(b"blob999"),
        string::utf8(b"video_blob_999"),
        string::utf8(b"thumb_blob_999"),
        string::utf8(b"hash999"),
        50,
        ts::ctx(&mut scenario)
    );

    ts::return_to_sender(&scenario, admin_cap);
    ts::end(scenario);
}

#[test]
#[expected_failure(location = admin, abort_code = 5)] // EInvalidURI
fun test_register_empty_uri() {
    let mut scenario = ts::begin(ADMIN);
    init_contract(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

    // Try to register moment with empty video URI (should fail)
    admin::register_moment(
        &admin_cap,
        string::utf8(b"MATCH005"),
        string::utf8(b"Fighter I"),
        string::utf8(b"Fighter J"),
        string::utf8(b"SUBMISSION"),
        string::utf8(b""),  // Empty video URI
        string::utf8(b"walrus://thumb888"),
        string::utf8(b"blob888"),
        string::utf8(b"video_blob_888"),
        string::utf8(b"thumb_blob_888"),
        string::utf8(b"hash888"),
        50,
        ts::ctx(&mut scenario)
    );

    ts::return_to_sender(&scenario, admin_cap);
    ts::end(scenario);
}
