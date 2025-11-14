# Specification: Public Getters

**Capability**: `public-getters`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Public getter functions provide read access to moment and NFT metadata without requiring admin privileges. These functions enable frontend applications, marketplaces, and wallets to query data efficiently for display and filtering purposes.

---

## ADDED Requirements

### Requirement: Query Moment Metadata

**Priority**: CRITICAL  
**Source**: RQ-GET-01, RQ-GET-02

The system MUST provide public functions to retrieve moment metadata without requiring AdminCap.

#### Scenario: Get moment metadata

**Given**:
- A `MintableMoment` exists with match_id, fighters, moment_type, URIs

**When**:
- Anyone calls `get_moment_metadata(moment_id)`

**Then**:
- The function returns:
  - match_id
  - fighter_a
  - fighter_b
  - moment_type
  - video_uri
  - thumbnail_uri
  - max_supply
  - current_supply
  - is_active

**Verification**:
```bash
sui client call --function get_moment_metadata --args <moment-id>
# Should return all moment fields
```

---

#### Scenario: No AdminCap required for getters

**Given**:
- A user does NOT own AdminCap
- A moment exists

**When**:
- User calls any getter function (e.g., `get_moment_metadata()`)

**Then**:
- The function executes successfully
- No permission check required
- Data is returned

**Verification**:
- Non-admin can query data

---

### Requirement: Calculate Remaining Supply

**Priority**: CRITICAL  
**Source**: RQ-GET-03

The system MUST provide a function to calculate and return remaining mintable supply for a moment.

#### Scenario: Get remaining mint supply

**Given**:
- A moment with max_supply = 1000, current_supply = 350

**When**:
- Anyone calls `get_remaining_supply(moment_id)`

**Then**:
- The function returns: 650 (max_supply - current_supply)

**Verification**:
```bash
sui client call --function get_remaining_supply --args <moment-id>
# Should return 650
```

---

#### Scenario: Remaining supply is zero when exhausted

**Given**:
- A moment with max_supply = 100, current_supply = 100

**When**:
- Anyone calls `get_remaining_supply(moment_id)`

**Then**:
- The function returns: 0
- Indicates no more mints available

**Verification**:
- Returns 0

---

### Requirement: Query NFT Metadata

**Priority**: CRITICAL  
**Source**: RQ-GET-01, RQ-GET-02

The system MUST provide public functions to retrieve NFT metadata for display purposes.

#### Scenario: Get NFT metadata

**Given**:
- An NFT exists with all metadata fields

**When**:
- Anyone calls `get_nft_metadata(nft_id)`

**Then**:
- The function returns:
  - moment_id (source moment reference)
  - match_id
  - moment_type
  - fighter_a
  - fighter_b
  - video_uri
  - thumbnail_uri
  - minted_at (timestamp)
  - serial_number
  - collection_id

**Verification**:
```bash
sui client call --function get_nft_metadata --args <nft-id>
# Should return all NFT fields
```

---

### Requirement: Marketplace-Friendly Getters

**Priority**: HIGH  
**Source**: RQ-GET-04

The system SHALL provide convenience functions that return marketplace-relevant data in a single call.

#### Scenario: Get marketplace display data

**Given**:
- An NFT exists in a Kiosk

**When**:
- Marketplace calls `get_marketplace_data(nft_id)`

**Then**:
- The function returns (in one call):
  - collection_id (for filtering)
  - match_id (for categorization)
  - moment_type (for categorization)
  - thumbnail_uri (for display)

**Verification**:
- Single call returns all marketplace-needed data
- No additional queries required

---

#### Scenario: Get collection identifier

**Given**:
- An NFT exists

**When**:
- Anyone calls `get_collection_id(nft_id)`

**Then**:
- The function returns the collection_id string
- E.g., "fight-moments-v1"

**Verification**:
- Returns correct collection_id

---

## Test Coverage

### Unit Tests Required

1. **test_get_moment_metadata**
   - Create moment, query metadata
   - Verify all fields returned correctly

2. **test_get_remaining_supply**
   - Create moment with max_supply = 100, current_supply = 30
   - Call `get_remaining_supply()`
   - Verify returns 70

3. **test_get_remaining_supply_zero**
   - Create moment with max_supply = 10, current_supply = 10
   - Call `get_remaining_supply()`
   - Verify returns 0

4. **test_get_nft_metadata**
   - Mint NFT, query metadata
   - Verify all fields returned correctly

5. **test_get_collection_id**
   - Mint NFT, call `get_collection_id()`
   - Verify returns expected collection_id

6. **test_get_marketplace_data**
   - Mint NFT, call `get_marketplace_data()`
   - Verify returns collection_id, match_id, moment_type, thumbnail_uri

7. **test_getters_no_admin_required**
   - Non-admin calls all getter functions
   - Verify all succeed

---

## Dependencies

### External
- None (read-only functions)

### Internal
- `MintableMoment` struct
- `FightMomentNFT` struct
- `WalrusMedia` struct

---

## Error Codes

- `E_MOMENT_NOT_FOUND`: Moment ID does not exist (abort code: 13)
- `E_NFT_NOT_FOUND`: NFT ID does not exist (abort code: 40)

---

## Function Signatures (Reference)

```move
// Moment queries
public fun get_moment_metadata(moment: &MintableMoment): MomentMetadata;
public fun get_remaining_supply(moment: &MintableMoment): u64;

// NFT queries
public fun get_nft_metadata(nft: &FightMomentNFT): NFTMetadata;
public fun get_collection_id(nft: &FightMomentNFT): String;

// Marketplace convenience
public fun get_marketplace_data(nft: &FightMomentNFT): MarketplaceData;
```

**Return Structs** (for convenience):
```move
struct MomentMetadata has drop {
    match_id: String,
    fighter_a: String,
    fighter_b: String,
    moment_type: String,
    video_uri: String,
    thumbnail_uri: String,
    max_supply: u64,
    current_supply: u64,
    is_active: bool,
}

struct NFTMetadata has drop {
    moment_id: ID,
    match_id: String,
    moment_type: String,
    fighter_a: String,
    fighter_b: String,
    video_uri: String,
    thumbnail_uri: String,
    minted_at: u64,
    serial_number: u64,
    collection_id: String,
}

struct MarketplaceData has drop {
    collection_id: String,
    match_id: String,
    moment_type: String,
    thumbnail_uri: String,
}
```

---

## Integration Notes

### Frontend Query Patterns

**Moment Browsing**:
```typescript
// Get all moments (via RPC query for shared objects)
const moments = await client.getOwnedObjects({ type: 'MintableMoment' });

// For each moment, get metadata
for (const moment of moments) {
  const metadata = await client.call('get_moment_metadata', [moment.id]);
  const remaining = await client.call('get_remaining_supply', [moment.id]);
  // Display in UI
}
```

**NFT Display**:
```typescript
// User's NFTs (in their Kiosk)
const kiosk = await getKiosk(userAddress);
const nfts = kiosk.items.filter(item => item.type.includes('FightMomentNFT'));

// Get metadata for each
for (const nft of nfts) {
  const metadata = await client.call('get_nft_metadata', [nft.id]);
  // Display thumbnail_uri, match_id, etc.
}
```

**Marketplace**:
```typescript
// Get listed NFTs from all Kiosks
const listings = await getKioskListings();

// Filter by collection
const fightMomentsListings = listings.filter(async listing => {
  const data = await client.call('get_marketplace_data', [listing.nft_id]);
  return data.collection_id === 'fight-moments-v1';
});
```

---

## Performance Considerations

- All getters are read-only (no gas cost)
- No complex computations (simple field access)
- Can be called unlimited times without blockchain state changes
- Frontend should cache results and invalidate on events
