# Specification: Moment Registration

**Capability**: `moment-registration`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Moment registration allows administrators to define "mintable moments" - fight highlights that users can later mint as NFTs. Each moment includes match metadata, fighter information, Walrus media references, and supply limits. Only admin accounts holding an AdminCap can register moments.

---

## ADDED Requirements

### Requirement: Admin Can Register Mintable Moments

**Priority**: CRITICAL  
**Source**: RQ-MOMENT-01, RQ-MOMENT-02, RQ-MOMENT-03

Administrators MUST be able to create mintable moments with complete metadata including match information, fighter details, Walrus media URIs, and supply limits.

#### Scenario: Admin successfully registers a new moment

**Given**:
- Admin owns an `AdminCap`
- Match data is available: match_id = "UFC300-001", fighters = "Fighter A" vs "Fighter B"
- Walrus URIs obtained: video_uri = "walrus://vid123...", thumbnail_uri = "walrus://thumb456..."
- Supply limit defined: max_supply = 1000

**When**:
- Admin calls `register_moment()` with:
  - match_id: "UFC300-001"
  - fighter_a: "Fighter A"
  - fighter_b: "Fighter B"
  - moment_type: "KO"
  - video_walrus_uri: "walrus://vid123..."
  - thumbnail_walrus_uri: "walrus://thumb456..."
  - walrus_hash: "abc123..."
  - max_supply: 1000

**Then**:
- A `MintableMoment` shared object is created
- The moment has `current_supply = 0`
- The moment has `is_active = true`
- The moment ID is returned
- A `MomentRegistered` event is emitted

**Verification**:
```bash
sui client object <moment-id>
# Should show MintableMoment with correct metadata
```

---

#### Scenario: Registration fails without AdminCap

**Given**:
- A user account does NOT own an `AdminCap`
- Valid moment data is prepared

**When**:
- The user attempts to call `register_moment()`

**Then**:
- The transaction fails with error `E_NOT_ADMIN`
- No `MintableMoment` is created
- No event is emitted

**Verification**:
- Transaction aborted
- No new shared objects created

---

#### Scenario: Registration fails with empty match_id

**Given**:
- Admin owns an `AdminCap`
- Moment data prepared with `match_id = ""`

**When**:
- Admin calls `register_moment()` with empty match_id

**Then**:
- The transaction fails with error `E_INVALID_MATCH_ID`
- No `MintableMoment` is created

**Verification**:
- Transaction aborted
- Error message indicates empty match_id

---

#### Scenario: Registration fails with empty moment_type

**Given**:
- Admin owns an `AdminCap`
- Moment data prepared with `moment_type = ""`

**When**:
- Admin calls `register_moment()` with empty moment_type

**Then**:
- The transaction fails with error `E_INVALID_MOMENT_TYPE`
- No `MintableMoment` is created

**Verification**:
- Transaction aborted
- Error message indicates empty moment_type

---

### Requirement: Dual Walrus URI Storage (Video + Thumbnail)

**Priority**: CRITICAL  
**Source**: RQ-MOMENT-05, RQ-WALRUS-01, RQ-WALRUS-03

The system MUST store both video URI and thumbnail URI separately to support efficient display (thumbnail in lists, video in detail views).

#### Scenario: Register moment with both video and thumbnail URIs

**Given**:
- Admin owns an `AdminCap`
- Video uploaded to Walrus: video_uri = "walrus://video123"
- Thumbnail uploaded to Walrus: thumbnail_uri = "walrus://thumb456"

**When**:
- Admin calls `register_moment()` including both URIs

**Then**:
- The `MintableMoment` stores both `video_walrus_uri` and `thumbnail_walrus_uri`
- Both URIs are accessible via getters
- Both URIs are copied to minted NFTs

**Verification**:
```bash
sui client call --function get_moment_metadata --args <moment-id>
# Should return both video_uri and thumbnail_uri
```

---

#### Scenario: Registration fails with missing video URI

**Given**:
- Admin owns an `AdminCap`
- Moment data prepared with `video_walrus_uri = ""`

**When**:
- Admin calls `register_moment()` with empty video URI

**Then**:
- The transaction fails with error `E_INVALID_WALRUS_URI`
- No `MintableMoment` is created

**Verification**:
- Transaction aborted

---

#### Scenario: Registration fails with missing thumbnail URI

**Given**:
- Admin owns an `AdminCap`
- Moment data prepared with `thumbnail_walrus_uri = ""`

**When**:
- Admin calls `register_moment()` with empty thumbnail URI

**Then**:
- The transaction fails with error `E_INVALID_WALRUS_URI`
- No `MintableMoment` is created

**Verification**:
- Transaction aborted

---

### Requirement: Walrus URI Format Validation

**Priority**: HIGH  
**Source**: RQ-MOMENT-06, RQ-WALRUS-02

The contract MUST validate Walrus URI format (starts with "walrus://") but MUST NOT verify content existence or reachability.

#### Scenario: Valid Walrus URI format accepted

**Given**:
- Admin owns an `AdminCap`
- URIs provided: "walrus://abc123...", "walrus://def456..."

**When**:
- Admin calls `register_moment()` with these URIs

**Then**:
- URIs pass validation (start with "walrus://")
- Moment is successfully registered

**Verification**:
- Moment created with URIs stored

---

#### Scenario: Invalid URI format rejected

**Given**:
- Admin owns an `AdminCap`
- Invalid URI provided: "https://example.com/video.mp4"

**When**:
- Admin calls `register_moment()` with non-Walrus URI

**Then**:
- The transaction fails with error `E_INVALID_WALRUS_URI`
- No moment is created

**Verification**:
- Transaction aborted
- Error indicates URI must start with "walrus://"

---

### Requirement: Moment Activation Events

**Priority**: HIGH  
**Source**: RQ-MOMENT-04, RQ-EVENT-01

The system MUST emit a `MomentRegistered` event when a new moment is created, including key metadata for off-chain indexing.

#### Scenario: Event emitted on successful registration

**Given**:
- Admin owns an `AdminCap`
- Valid moment data prepared

**When**:
- Admin calls `register_moment()` successfully

**Then**:
- A `MomentRegistered` event is emitted containing:
  - `moment_id`: ID of created moment
  - `match_id`: Match identifier
  - `moment_type`: Type of moment (KO, SUBMISSION, etc.)
  - `max_supply`: Maximum mintable supply
  - `timestamp`: Registration time

**Verification**:
```bash
sui client events --module fight_moments
# Should show MomentRegistered event with correct data
```

---

### Requirement: Creator Address Tracking

**Priority**: MEDIUM  
**Source**: RQ-MOMENT-01 (optional creator field), RQ-ROYALTY-01

The system SHALL store a creator address for future royalty distribution tracking.

#### Scenario: Creator address stored in moment

**Given**:
- Admin owns an `AdminCap`
- Creator address provided: 0xCreatorAddress

**When**:
- Admin calls `register_moment()` with optional creator parameter

**Then**:
- The `MintableMoment` stores `creator = 0xCreatorAddress`
- This address can be used later for royalty setup

**Verification**:
- Moment metadata includes creator field

---

## ADDED Requirements (Management Functions)

### Requirement: Admin Can Deactivate Moments

**Priority**: HIGH  
**Source**: Implied by RQ-MINT-02 (is_active check)

Administrators MUST be able to deactivate moments to prevent further minting while preserving existing NFTs.

#### Scenario: Admin deactivates a moment

**Given**:
- Admin owns an `AdminCap`
- A moment exists with `is_active = true`
- Some NFTs already minted from this moment

**When**:
- Admin calls `deactivate_moment(moment_id)`

**Then**:
- The moment's `is_active` flag is set to `false`
- Existing NFTs remain unaffected
- Future mint attempts fail
- A `MomentDeactivated` event is emitted

**Verification**:
```bash
# Check moment status
sui client object <moment-id>
# is_active should be false

# Attempt to mint (should fail)
sui client call --function mint_moment --args <moment-id>
# Should abort with E_MOMENT_INACTIVE
```

---

#### Scenario: Admin reactivates a moment

**Given**:
- Admin owns an `AdminCap`
- A moment exists with `is_active = false`

**When**:
- Admin calls `reactivate_moment(moment_id)`

**Then**:
- The moment's `is_active` flag is set to `true`
- Users can mint again (if supply available)
- A `MomentReactivated` event is emitted

**Verification**:
- Moment is_active = true
- Minting succeeds

---

## Test Coverage

### Unit Tests Required

1. **test_register_moment_success**
   - Admin registers moment with all valid fields
   - Verify moment created with correct metadata
   - Verify current_supply = 0, is_active = true

2. **test_register_moment_requires_admin_cap**
   - Non-admin attempts registration
   - Verify transaction fails

3. **test_register_moment_validates_match_id**
   - Register with empty match_id
   - Verify transaction fails with E_INVALID_MATCH_ID

4. **test_register_moment_validates_moment_type**
   - Register with empty moment_type
   - Verify transaction fails with E_INVALID_MOMENT_TYPE

5. **test_register_moment_validates_walrus_uri_format**
   - Register with invalid URI (not starting with "walrus://")
   - Verify transaction fails with E_INVALID_WALRUS_URI

6. **test_register_moment_validates_both_uris_required**
   - Register with missing video or thumbnail URI
   - Verify transaction fails

7. **test_moment_registered_event_emitted**
   - Register moment successfully
   - Verify MomentRegistered event contains correct data

8. **test_deactivate_moment**
   - Admin deactivates moment
   - Verify is_active = false
   - Verify MomentDeactivated event emitted

9. **test_reactivate_moment**
   - Admin reactivates deactivated moment
   - Verify is_active = true
   - Verify MomentReactivated event emitted

---

## Dependencies

### External
- `sui::object::UID` - For moment object ID
- `sui::tx_context` - For timestamp and sender
- `sui::event` - For event emission

### Internal
- `AdminCap` struct (from initialization)
- `WalrusMedia` struct (media reference storage)
- `MintableMoment` struct definition

---

## Error Codes

- `E_NOT_ADMIN`: Caller does not own AdminCap (abort code: 1)
- `E_INVALID_MATCH_ID`: match_id is empty (abort code: 10)
- `E_INVALID_MOMENT_TYPE`: moment_type is empty (abort code: 11)
- `E_INVALID_WALRUS_URI`: URI format invalid or empty (abort code: 12)
- `E_MOMENT_NOT_FOUND`: Moment ID does not exist (abort code: 13)
- `E_MOMENT_INACTIVE`: Moment is deactivated (abort code: 14)

---

## Data Structures

### MintableMoment
```move
struct MintableMoment has key, store {
    id: UID,
    match_id: String,
    fighter_a: String,
    fighter_b: String,
    moment_type: String,
    media: WalrusMedia,
    max_supply: u64,
    current_supply: u64,
    creator: Option<address>,
    is_active: bool,
}
```

### Events
```move
struct MomentRegistered has copy, drop {
    moment_id: ID,
    match_id: String,
    moment_type: String,
    max_supply: u64,
    timestamp: u64,
}

struct MomentDeactivated has copy, drop {
    moment_id: ID,
    timestamp: u64,
}

struct MomentReactivated has copy, drop {
    moment_id: ID,
    timestamp: u64,
}
```
