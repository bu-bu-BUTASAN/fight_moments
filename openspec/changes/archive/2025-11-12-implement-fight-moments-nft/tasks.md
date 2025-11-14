# Implementation Tasks: Fight Moments NFT Contract

**Change ID**: `implement-fight-moments-nft`

## Task Ordering Strategy

Tasks are ordered to:
1. Build foundational structures first (data models, capabilities)
2. Enable incremental testing at each stage
3. Deliver user-visible progress early (basic mint → Kiosk → marketplace)
4. Leave optional features for last (royalties, advanced display)

## Dependencies Legend

- `→` Sequential dependency (must complete previous task)
- `||` Can be done in parallel
- `[VALIDATION]` Requires testing before proceeding

---

## Phase 1: Foundation & Setup

### T1.1: Project Configuration
**Status**: Ready  
**Estimated Effort**: 15 minutes

- [ ] Update `contracts/Move.toml` with Sui framework dependencies
  - Add `Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }`
  - Add Kiosk dependency
  - Set correct edition (`2024.beta`)
- [ ] Verify `sui move build` compiles clean
- [ ] Create test file structure in `contracts/tests/`

**Validation**: `sui move build` succeeds with no errors

---

### T1.2: Core Data Structures
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T1.1

- [ ] Define `WalrusMedia` struct (video_uri, thumbnail_uri, blob_id, content_hash)
- [ ] Define `AdminCap` struct (id: UID)
- [ ] Define `MintableMoment` struct with all required fields
- [ ] Define `FightMomentNFT` struct with all required fields
- [ ] Add documentation comments to all structs

**Validation**: `sui move build` compiles, structs visible in documentation

---

### T1.3: Module Initialization
**Status**: Ready  
**Estimated Effort**: 20 minutes  
**Depends On**: T1.2

- [ ] Implement `init()` function
  - Create and transfer `AdminCap` to deployer
  - Create `Publisher` for Object Display
  - Create `TransferPolicy<FightMomentNFT>` as shared object
  - Store `TransferPolicyCap` with AdminCap owner
- [ ] Add initialization event emission
- [ ] Write unit test for initialization

**Validation**: Test passes, verify AdminCap and TransferPolicy creation

---

## Phase 2: Admin Functions (Moment Registration)

### T2.1: Moment Registration Function
**Status**: Ready  
**Estimated Effort**: 45 minutes  
**Depends On**: T1.3

- [ ] Implement `register_moment()` entry function
  - Require `AdminCap` reference
  - Accept all moment parameters (match_id, fighters, type, URIs, max_supply)
  - Validate inputs (non-empty strings, valid URIs)
  - Create `MintableMoment` shared object
  - Initialize `current_supply = 0`, `is_active = true`
- [ ] Emit `MomentRegistered` event
- [ ] Write unit tests:
  - Successful registration
  - Reject if not admin
  - Reject invalid inputs (empty match_id, invalid URI format)

**Validation**: Tests pass, moment queryable via RPC

---

### T2.2: Moment Management Functions
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T2.1  
**Parallel With**: T3.1 (can develop simultaneously)

- [ ] Implement `deactivate_moment()` (sets `is_active = false`)
- [ ] Implement `reactivate_moment()` (sets `is_active = true`)
- [ ] Add admin-only assertions
- [ ] Write unit tests for activation toggle

**Validation**: Tests pass, active/inactive moments behave correctly

---

## Phase 3: User Minting & Kiosk Integration

### T3.1: Basic Mint Function (Without Kiosk)
**Status**: Ready  
**Estimated Effort**: 45 minutes  
**Depends On**: T1.3

- [ ] Implement `mint_moment_internal()` internal function
  - Look up `MintableMoment` by ID
  - Validate: `is_active == true`
  - Validate: `current_supply < max_supply`
  - Increment `current_supply`
  - Create `FightMomentNFT` with denormalized metadata
  - Assign `serial_number = current_supply`
  - Set `minted_at = timestamp`
  - Return NFT object
- [ ] Emit `NFTMinted` event
- [ ] Write unit tests:
  - Successful mint
  - Reject if supply exhausted
  - Reject if moment inactive
  - Verify serial number sequence

**Validation**: Tests pass, NFT created with correct metadata

---

### T3.2: Kiosk Integration for Mint
**Status**: Ready  
**Estimated Effort**: 1 hour  
**Depends On**: T3.1

- [ ] Implement `mint_and_lock()` entry function
  - Accept `kiosk: &mut Kiosk`, `kiosk_cap: &KioskOwnerCap`
  - Call `mint_moment_internal()`
  - Lock NFT in Kiosk using `kiosk::lock()`
  - Pass `TransferPolicy` reference for locking
- [ ] Implement `create_kiosk_and_mint()` entry function (for first-time users)
  - Create new Kiosk and KioskOwnerCap
  - Transfer KioskOwnerCap to user
  - Call `mint_and_lock()`
- [ ] Write unit tests:
  - Mint with existing Kiosk
  - Mint with new Kiosk creation
  - Verify NFT locked (cannot withdraw directly)

**Validation**: Tests pass, NFT locked in Kiosk after mint

---

### T3.3: Kiosk Listing Support
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T3.2  
**Parallel With**: T4.1

- [ ] Ensure NFT has `key + store` abilities (required for Kiosk)
- [ ] Verify `TransferPolicy` allows listing
- [ ] Write test for Kiosk list/delist operations
- [ ] Document listing flow for frontend

**Validation**: Test shows NFT can be listed in Kiosk with price

---

## Phase 4: Public Getters & Queries

### T4.1: Read Functions
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T2.1, T3.1

- [ ] Implement getter functions (public, no AdminCap required):
  - `get_moment_metadata(moment_id)` → returns match_id, fighters, type, URIs
  - `get_remaining_supply(moment_id)` → returns max_supply - current_supply
  - `get_nft_metadata(nft_id)` → returns all NFT fields
  - `get_collection_id(nft_id)` → returns collection identifier
- [ ] Write unit tests for all getters

**Validation**: Tests pass, data retrievable via RPC

---

## Phase 5: Object Display

### T5.1: Object Display Template
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T1.3, T3.1

- [ ] Implement `setup_display()` function (called in init or by admin)
  - Create `Display<FightMomentNFT>` template
  - Add fields: name, description, image_url, video_url, project_url
  - Use template syntax: `{field_name}` for dynamic values
  - Update and publish Display
- [ ] Write test to verify Display fields
- [ ] Test in Sui Explorer (manual verification)

**Validation**: Display template shows in Sui Explorer, wallets render correctly

---

## Phase 6: Transfer Policy & Royalties (Optional/Future)

### T6.1: Royalty Configuration Struct
**Status**: Optional (Future Enhancement)  
**Estimated Effort**: 30 minutes  
**Depends On**: T1.3

- [ ] Define `RoyaltyConfig` struct (3 parties: fighter_a, fighter_b, org)
- [ ] Add BPS fields (u16, basis points)
- [ ] Implement validation: total BPS ≤ 2000 (20%)
- [ ] Store in TransferPolicy metadata (not enforced yet)

**Validation**: Config stored, retrievable, not yet enforced

---

### T6.2: Royalty Management Functions
**Status**: Optional (Future Enhancement)  
**Estimated Effort**: 45 minutes  
**Depends On**: T6.1

- [ ] Implement `set_royalty_config()` (admin-only)
  - Update TransferPolicy with royalty data
  - Validate BPS sum
  - Validate addresses (non-zero if BPS > 0)
- [ ] Implement `get_royalty_config()` (public read)
- [ ] Write unit tests

**Validation**: Tests pass, config updatable by admin only

**Note**: Actual royalty enforcement requires TransferPolicy rule activation, deferred post-hackathon

---

## Phase 7: Events & Monitoring

### T7.1: Event Definitions
**Status**: Ready  
**Estimated Effort**: 20 minutes  
**Depends On**: T2.1, T3.1

- [ ] Define event structs:
  - `MomentRegistered` (moment_id, match_id, moment_type, max_supply)
  - `NFTMinted` (nft_id, moment_id, minter, timestamp, serial_number)
  - `MomentDeactivated` (moment_id)
  - `MomentReactivated` (moment_id)
- [ ] Ensure events emitted in corresponding functions
- [ ] Document event schemas for frontend

**Validation**: Events emitted in tests, viewable via `sui client events`

---

## Phase 8: Testing & Validation

### T8.1: Comprehensive Unit Tests
**Status**: Ready  
**Estimated Effort**: 1 hour  
**Depends On**: All previous tasks

- [ ] Test complete user flow: register → mint → lock → list
- [ ] Test edge cases:
  - Mint when supply = max_supply - 1 (last NFT)
  - Multiple users minting same moment concurrently
  - Deactivate moment, attempt mint (should fail)
- [ ] Test error messages are clear
- [ ] Verify gas usage is reasonable

**Validation**: All tests pass, `sui move test` shows 100% pass rate

---

### T8.2: Integration Test Scenarios
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T8.1

- [ ] Write end-to-end test simulating real usage:
  1. Admin registers moment
  2. User1 creates Kiosk and mints
  3. User2 mints to existing Kiosk
  4. User1 lists NFT
  5. User2 purchases (using Kiosk APIs)
- [ ] Document test results

**Validation**: E2E scenario completes successfully

---

## Phase 9: Documentation & Deployment Prep

### T9.1: Code Documentation
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T8.2

- [ ] Add doc comments to all public functions
- [ ] Document error codes and meanings
- [ ] Create API reference (auto-generated from docs)
- [ ] Add inline comments for complex logic

**Validation**: `sui move build --doc` generates clean documentation

---

### T9.2: Deployment Guide
**Status**: Ready  
**Estimated Effort**: 20 minutes  
**Depends On**: T9.1

- [ ] Write deployment instructions:
  - Environment setup (Sui CLI, wallet)
  - Build command
  - Publish command
  - Post-deployment verification steps
- [ ] Document required environment variables
- [ ] Create checklist for testnet deployment

**Validation**: Follow guide on clean environment, successful deploy

---

### T9.3: Frontend Integration Guide
**Status**: Ready  
**Estimated Effort**: 30 minutes  
**Depends On**: T9.1

- [ ] Document contract ABIs (function signatures)
- [ ] List all events with schemas
- [ ] Provide example transactions (PTB construction)
- [ ] Document getter functions for frontend queries

**Validation**: Frontend team can read and understand integration points

---

## Milestone Summary

| Milestone | Tasks | Estimated Time | User-Visible Progress |
|-----------|-------|----------------|----------------------|
| **M1: Foundation** | T1.1 - T1.3 | 1 hour | Contract compiles, basic structure |
| **M2: Admin Features** | T2.1 - T2.2 | 1.25 hours | Admin can register moments |
| **M3: User Minting** | T3.1 - T3.3 | 2.25 hours | Users can mint NFTs, locked in Kiosk |
| **M4: Queries** | T4.1 | 0.5 hours | Frontend can query moment/NFT data |
| **M5: Display** | T5.1 | 0.5 hours | NFTs show in wallets/explorers |
| **M6: Royalties** | T6.1 - T6.2 | 1.25 hours | (Optional) Royalty structure ready |
| **M7: Events** | T7.1 | 0.33 hours | Events emitted for off-chain sync |
| **M8: Testing** | T8.1 - T8.2 | 1.5 hours | All tests pass, ready for deploy |
| **M9: Documentation** | T9.1 - T9.3 | 1.33 hours | Complete deployment + integration docs |

**Total Estimated Time**: ~10 hours (excluding optional royalty features: ~8.5 hours for MVP)

---

## Critical Path

The fastest path to working MVP (excluding optional features):

```
T1.1 → T1.2 → T1.3 → T2.1 → T3.1 → T3.2 → T4.1 → T5.1 → T7.1 → T8.1 → T9.1 → T9.2
```

**Critical Path Time**: ~7.5 hours

---

## Parallelization Opportunities

These tasks can be worked on simultaneously by different developers:

- **Parallel Set 1**: T2.2 (Moment management) || T3.1 (Basic mint)
- **Parallel Set 2**: T3.3 (Kiosk listing) || T4.1 (Getters)
- **Parallel Set 3**: T6.1 (Royalty struct) || T7.1 (Events) || T9.1 (Docs)

---

## Next Steps After Completion

1. **Testnet Deployment**
   - Deploy to Sui testnet
   - Verify AdminCap ownership
   - Test with frontend

2. **Frontend Integration**
   - Implement admin panel (moment registration)
   - Implement user mint flow
   - Implement marketplace UI

3. **Mainnet Readiness** (Post-Hackathon)
   - Security audit
   - Activate royalty enforcement
   - Optimize gas costs
   - Deploy to mainnet
