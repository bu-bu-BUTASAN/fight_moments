# Specification: User Minting

**Capability**: `user-mint`  
**Change ID**: `implement-fight-moments-nft`

## Overview

User minting enables any wallet holder to mint Fight Moment NFTs from registered moments. The minted NFTs are automatically locked in the user's Sui Kiosk, preventing direct transfers and ensuring marketplace compatibility. First-time minters receive a new Kiosk automatically.

---

## ADDED Requirements

### Requirement: Users Can Mint NFTs from Registered Moments

**Priority**: CRITICAL  
**Source**: RQ-MINT-01, RQ-MINT-02, RQ-MINT-03

Users MUST be able to mint NFTs from available moments, subject to supply limits and activation status. The contract MUST enforce all validation rules atomically.

#### Scenario: User successfully mints an NFT

**Given**:
- A `MintableMoment` exists with:
  - match_id = "UFC300-001"
  - moment_type = "KO"
  - max_supply = 1000
  - current_supply = 0
  - is_active = true
- User has a Kiosk and KioskOwnerCap

**When**:
- User calls `mint_and_lock(moment_id, kiosk, kiosk_cap)`

**Then**:
- A `FightMomentNFT` is created with:
  - moment_id referencing the source moment
  - Denormalized metadata (match_id, fighters, moment_type)
  - Both video_uri and thumbnail_uri from moment
  - serial_number = 1 (current_supply incremented to 1)
  - minted_at = current timestamp
  - collection_id for marketplace filtering
- The NFT is locked in the user's Kiosk
- The moment's current_supply is incremented to 1
- An `NFTMinted` event is emitted

**Verification**:
```bash
# Check Kiosk contents
sui client object <kiosk-id>
# Should show locked NFT

# Check moment supply
sui client object <moment-id>
# current_supply should be 1
```

---

#### Scenario: Mint fails when supply is exhausted

**Given**:
- A moment exists with max_supply = 10, current_supply = 10
- User has a Kiosk

**When**:
- User attempts to mint from this moment

**Then**:
- The transaction fails with error `E_SUPPLY_EXHAUSTED`
- No NFT is created
- current_supply remains 10

**Verification**:
- Transaction aborted
- No new NFTs in Kiosk

---

#### Scenario: Mint fails when moment is inactive

**Given**:
- A moment exists with is_active = false
- User has a Kiosk

**When**:
- User attempts to mint from this moment

**Then**:
- The transaction fails with error `E_MOMENT_INACTIVE`
- No NFT is created
- current_supply unchanged

**Verification**:
- Transaction aborted

---

#### Scenario: Serial numbers increment sequentially

**Given**:
- A moment with max_supply = 100, current_supply = 0
- Three users: Alice, Bob, Charlie

**When**:
- Alice mints (current_supply 0 → 1)
- Bob mints (current_supply 1 → 2)
- Charlie mints (current_supply 2 → 3)

**Then**:
- Alice's NFT has serial_number = 1
- Bob's NFT has serial_number = 2
- Charlie's NFT has serial_number = 3
- Moment's current_supply = 3

**Verification**:
- Query each NFT's serial_number field
- Verify uniqueness and sequence

---

### Requirement: Automatic Kiosk Integration

**Priority**: CRITICAL  
**Source**: RQ-MINT-08, RQ-MINT-09, RQ-KIOSK-01

NFTs MUST be automatically locked in the user's Kiosk upon minting. Direct transfer to user's wallet is NOT allowed.

#### Scenario: NFT locked in Kiosk after mint

**Given**:
- User has an existing Kiosk and KioskOwnerCap
- A mintable moment is available

**When**:
- User calls `mint_and_lock(moment_id, kiosk, kiosk_cap)`

**Then**:
- The NFT is created
- `kiosk::lock()` is called automatically
- The NFT is locked in the Kiosk (cannot be withdrawn directly)
- The user retains ownership via KioskOwnerCap

**Verification**:
```bash
# Try to withdraw (should fail)
sui client call --function kiosk::take --args <kiosk-id> <kiosk-cap> <nft-id>
# Should abort - NFT is locked
```

---

#### Scenario: Mint uses TransferPolicy for locking

**Given**:
- A `TransferPolicy<FightMomentNFT>` exists (created in init)
- User mints an NFT

**When**:
- `kiosk::lock()` is called during mint

**Then**:
- The TransferPolicy is referenced in the lock operation
- Future transfer attempts will be subject to TransferPolicy rules
- The lock is permanent (NFT cannot be unlocked)

**Verification**:
- Kiosk shows NFT with policy reference

---

### Requirement: First-Time Kiosk Creation

**Priority**: HIGH  
**Source**: RQ-MINT-10

Users without a Kiosk MUST be able to create one during their first mint operation, in a single transaction.

#### Scenario: User mints without existing Kiosk

**Given**:
- User does NOT own a Kiosk
- A mintable moment is available

**When**:
- User calls `create_kiosk_and_mint(moment_id)`

**Then**:
- A new Kiosk is created
- A new KioskOwnerCap is created and transferred to user
- An NFT is minted and locked in the new Kiosk
- All in one transaction (atomic)

**Verification**:
```bash
# Check user's objects
sui client objects --owned-by <user-address>
# Should show KioskOwnerCap

# Check Kiosk contents
sui client object <kiosk-id>
# Should show locked NFT
```

---

### Requirement: NFT Metadata Denormalization

**Priority**: CRITICAL  
**Source**: RQ-MINT-04, RQ-MINT-07, RQ-KIOSK-03

Each minted NFT MUST contain a complete copy of essential metadata from the moment, enabling display without additional lookups.

#### Scenario: NFT contains all display metadata

**Given**:
- A moment with:
  - match_id = "UFC300-001"
  - fighter_a = "Fighter A", fighter_b = "Fighter B"
  - moment_type = "KO"
  - video_uri = "walrus://vid123", thumbnail_uri = "walrus://thumb456"

**When**:
- User mints an NFT from this moment

**Then**:
- The NFT contains (denormalized):
  - moment_id (reference to source)
  - match_id = "UFC300-001"
  - fighter_a = "Fighter A"
  - fighter_b = "Fighter B"
  - moment_type = "KO"
  - media.video_uri = "walrus://vid123"
  - media.thumbnail_uri = "walrus://thumb456"
  - collection_id (for marketplace filtering)

**Verification**:
- Query NFT metadata via getter
- All fields present and match moment

---

#### Scenario: NFT includes collection identifier

**Given**:
- The contract defines a collection_id = "fight-moments-v1"
- User mints an NFT

**When**:
- The NFT is created

**Then**:
- The NFT's `collection_id` field = "fight-moments-v1"
- Marketplace can filter NFTs by this collection

**Verification**:
- NFT metadata includes collection_id
- Multiple NFTs share same collection_id

---

### Requirement: Mint Event Emission

**Priority**: HIGH  
**Source**: RQ-EVENT-01, RQ-EVENT-03

The system MUST emit an `NFTMinted` event for each successful mint, enabling off-chain indexing and UI updates.

#### Scenario: Event emitted on successful mint

**Given**:
- User mints an NFT successfully

**When**:
- The mint transaction completes

**Then**:
- An `NFTMinted` event is emitted containing:
  - nft_id: ID of created NFT
  - moment_id: Source moment ID
  - minter: User's address
  - timestamp: Mint time
  - serial_number: NFT's serial number

**Verification**:
```bash
sui client events --module fight_moments
# Should show NFTMinted event
```

---

## Test Coverage

### Unit Tests Required

1. **test_mint_nft_success**
   - User mints NFT from valid moment
   - Verify NFT created with correct metadata
   - Verify NFT locked in Kiosk
   - Verify current_supply incremented

2. **test_mint_fails_supply_exhausted**
   - Attempt mint when current_supply == max_supply
   - Verify transaction fails with E_SUPPLY_EXHAUSTED

3. **test_mint_fails_moment_inactive**
   - Attempt mint when is_active == false
   - Verify transaction fails with E_MOMENT_INACTIVE

4. **test_mint_serial_numbers_increment**
   - Multiple users mint from same moment
   - Verify serial numbers are sequential: 1, 2, 3, ...

5. **test_mint_locks_in_kiosk**
   - Mint NFT
   - Attempt to withdraw from Kiosk
   - Verify withdrawal fails (NFT is locked)

6. **test_mint_uses_transfer_policy**
   - Verify lock operation references TransferPolicy
   - Verify NFT subject to future policy rules

7. **test_create_kiosk_and_mint**
   - User without Kiosk calls create_kiosk_and_mint()
   - Verify Kiosk created, KioskOwnerCap transferred, NFT locked
   - Verify all in one transaction

8. **test_nft_metadata_denormalized**
   - Mint NFT
   - Verify NFT contains all moment metadata
   - Verify collection_id present

9. **test_mint_event_emitted**
   - Mint NFT
   - Verify NFTMinted event contains correct data

10. **test_concurrent_mints**
    - Simulate multiple users minting simultaneously
    - Verify supply increments correctly
    - Verify no race conditions

---

## Dependencies

### External
- `sui::kiosk` - For Kiosk lock operation
- `sui::kiosk::KioskOwnerCap` - For ownership verification
- `sui::transfer_policy::TransferPolicy` - For locking policy
- `sui::tx_context` - For timestamp and sender address

### Internal
- `MintableMoment` struct (from moment-registration)
- `FightMomentNFT` struct definition
- `WalrusMedia` struct
- `TransferPolicy<FightMomentNFT>` (from initialization)

---

## Error Codes

- `E_MOMENT_NOT_FOUND`: Moment ID does not exist (abort code: 13)
- `E_MOMENT_INACTIVE`: Moment is deactivated (abort code: 14)
- `E_SUPPLY_EXHAUSTED`: current_supply >= max_supply (abort code: 20)
- `E_INVALID_KIOSK_CAP`: KioskOwnerCap does not match Kiosk (abort code: 21)

---

## Data Structures

### FightMomentNFT
```move
struct FightMomentNFT has key, store {
    id: UID,
    moment_id: ID,
    match_id: String,
    moment_type: String,
    fighter_a: String,
    fighter_b: String,
    media: WalrusMedia,
    minted_at: u64,
    serial_number: u64,
    collection_id: String,
}
```

### Events
```move
struct NFTMinted has copy, drop {
    nft_id: ID,
    moment_id: ID,
    minter: address,
    timestamp: u64,
    serial_number: u64,
}
```

---

## Integration Notes

### Frontend Integration
- Frontend should check if user has Kiosk before mint:
  - If yes: call `mint_and_lock()`
  - If no: call `create_kiosk_and_mint()`
- Use PTB to batch operations if needed

### Gas Optimization
- Kiosk creation adds ~50% more gas
- Advise users to create Kiosk once, reuse for future mints
- Consider batching multiple mints in one PTB (future enhancement)
