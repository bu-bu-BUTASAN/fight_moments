# public-getters Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
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

