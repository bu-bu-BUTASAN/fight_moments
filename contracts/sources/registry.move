// Copyright (c) Fight Moments
// SPDX-License-Identifier: MIT

/// Registry module for managing mintable moments in a centralized Table
module fight_moments::registry {
    use std::string::String;
    use sui::table::{Self, Table};

    use fight_moments::types::AdminCap;

    // ==================== Error Codes ====================

    const EMomentNotFound: u64 = 1;
    const EMomentAlreadyExists: u64 = 2;

    // ==================== Structs ====================

    /// Registry for managing all mintable moments
    /// This is a shared object that stores metadata for all moments
    public struct MomentRegistry has key {
        id: UID,
        /// Mapping of moment_id => MomentMetadata
        moments: Table<ID, MomentMetadata>,
        /// List of moment IDs in registration order (for easy iteration)
        moment_ids: vector<ID>,
    }

    /// Metadata for a mintable moment
    /// This is stored in the Table and can be queried via devInspect
    public struct MomentMetadata has store, copy, drop {
        moment_id: ID,
        match_id: String,
        fighter_a: String,
        fighter_b: String,
        moment_type: String,
        video_blob_id: String,
        thumbnail_blob_id: String,
        max_supply: u64,
        current_supply: u64,
        creator: address,
        is_active: bool,
    }

    // ==================== Initialization ====================

    /// Creates a new MomentRegistry
    /// Called from the main init function
    public fun create_registry(ctx: &mut TxContext): MomentRegistry {
        MomentRegistry {
            id: object::new(ctx),
            moments: table::new<ID, MomentMetadata>(ctx),
            moment_ids: vector::empty<ID>(),
        }
    }

    /// Shares the MomentRegistry as a shared object
    public fun share_registry(registry: MomentRegistry) {
        transfer::share_object(registry);
    }

    // ==================== Admin Functions ====================

    /// Adds a new moment to the registry
    /// Only callable by admin
    public fun add_moment_to_registry(
        registry: &mut MomentRegistry,
        _admin_cap: &AdminCap,
        moment_id: ID,
        metadata: MomentMetadata,
    ) {
        // Check if moment already exists
        assert!(!table::contains(&registry.moments, moment_id), EMomentAlreadyExists);

        // Add to table
        table::add(&mut registry.moments, moment_id, metadata);

        // Add to ID list
        vector::push_back(&mut registry.moment_ids, moment_id);
    }

    /// Updates the supply of a moment
    /// Called when a moment is minted
    public fun update_moment_supply(
        registry: &mut MomentRegistry,
        moment_id: ID,
        new_supply: u64,
    ) {
        assert!(table::contains(&registry.moments, moment_id), EMomentNotFound);

        let metadata = table::borrow_mut(&mut registry.moments, moment_id);
        metadata.current_supply = new_supply;
    }

    /// Updates the active status of a moment
    /// Only callable by admin
    public fun update_moment_status(
        registry: &mut MomentRegistry,
        _admin_cap: &AdminCap,
        moment_id: ID,
        is_active: bool,
    ) {
        assert!(table::contains(&registry.moments, moment_id), EMomentNotFound);

        let metadata = table::borrow_mut(&mut registry.moments, moment_id);
        metadata.is_active = is_active;
    }

    /// Removes a moment from the registry
    /// Only callable by admin
    public fun remove_moment_from_registry(
        registry: &mut MomentRegistry,
        _admin_cap: &AdminCap,
        moment_id: ID,
    ) {
        assert!(table::contains(&registry.moments, moment_id), EMomentNotFound);

        // Remove from table
        let _metadata = table::remove(&mut registry.moments, moment_id);

        // Remove from ID list
        let (exists, index) = vector::index_of(&registry.moment_ids, &moment_id);
        if (exists) {
            vector::remove(&mut registry.moment_ids, index);
        };
    }

    // ==================== Public Getter Functions (for devInspect) ====================

    /// Returns all moment metadata
    /// This function is designed to be called via devInspect
    public fun get_all_moments(registry: &MomentRegistry): vector<MomentMetadata> {
        let mut result = vector::empty<MomentMetadata>();
        let len = vector::length(&registry.moment_ids);
        let mut i = 0;

        while (i < len) {
            let moment_id = *vector::borrow(&registry.moment_ids, i);
            if (table::contains(&registry.moments, moment_id)) {
                let metadata = *table::borrow(&registry.moments, moment_id);
                vector::push_back(&mut result, metadata);
            };
            i = i + 1;
        };

        result
    }

    /// Returns only active moments
    /// This function is designed to be called via devInspect
    public fun get_active_moments(registry: &MomentRegistry): vector<MomentMetadata> {
        let mut result = vector::empty<MomentMetadata>();
        let len = vector::length(&registry.moment_ids);
        let mut i = 0;

        while (i < len) {
            let moment_id = *vector::borrow(&registry.moment_ids, i);
            if (table::contains(&registry.moments, moment_id)) {
                let metadata = *table::borrow(&registry.moments, moment_id);
                if (metadata.is_active) {
                    vector::push_back(&mut result, metadata);
                };
            };
            i = i + 1;
        };

        result
    }

    /// Returns metadata for a single moment
    /// This function is designed to be called via devInspect
    public fun get_moment(registry: &MomentRegistry, moment_id: ID): MomentMetadata {
        assert!(table::contains(&registry.moments, moment_id), EMomentNotFound);
        *table::borrow(&registry.moments, moment_id)
    }

    /// Checks if a moment exists in the registry
    public fun moment_exists(registry: &MomentRegistry, moment_id: ID): bool {
        table::contains(&registry.moments, moment_id)
    }

    /// Returns the total number of moments in the registry
    public fun get_moment_count(registry: &MomentRegistry): u64 {
        table::length(&registry.moments)
    }

    // ==================== Helper Functions for Creating Metadata ====================

    /// Creates a new MomentMetadata struct
    /// Helper function for creating metadata when registering moments
    public fun new_metadata(
        moment_id: ID,
        match_id: String,
        fighter_a: String,
        fighter_b: String,
        moment_type: String,
        video_blob_id: String,
        thumbnail_blob_id: String,
        max_supply: u64,
        creator: address,
    ): MomentMetadata {
        MomentMetadata {
            moment_id,
            match_id,
            fighter_a,
            fighter_b,
            moment_type,
            video_blob_id,
            thumbnail_blob_id,
            max_supply,
            current_supply: 0,
            creator,
            is_active: true,
        }
    }

    // ==================== Accessor Functions for Metadata Fields ====================

    public fun metadata_moment_id(metadata: &MomentMetadata): ID { metadata.moment_id }
    public fun metadata_match_id(metadata: &MomentMetadata): String { metadata.match_id }
    public fun metadata_fighter_a(metadata: &MomentMetadata): String { metadata.fighter_a }
    public fun metadata_fighter_b(metadata: &MomentMetadata): String { metadata.fighter_b }
    public fun metadata_moment_type(metadata: &MomentMetadata): String { metadata.moment_type }
    public fun metadata_video_blob_id(metadata: &MomentMetadata): String { metadata.video_blob_id }
    public fun metadata_thumbnail_blob_id(metadata: &MomentMetadata): String { metadata.thumbnail_blob_id }
    public fun metadata_max_supply(metadata: &MomentMetadata): u64 { metadata.max_supply }
    public fun metadata_current_supply(metadata: &MomentMetadata): u64 { metadata.current_supply }
    public fun metadata_creator(metadata: &MomentMetadata): address { metadata.creator }
    public fun metadata_is_active(metadata: &MomentMetadata): bool { metadata.is_active }

    // ==================== Test Functions ====================

    #[test_only]
    public fun create_registry_for_testing(ctx: &mut TxContext): MomentRegistry {
        create_registry(ctx)
    }

    #[test_only]
    public fun destroy_registry_for_testing(registry: MomentRegistry) {
        let MomentRegistry { id, moments, moment_ids: _ } = registry;
        table::drop(moments);
        object::delete(id);
    }
}
