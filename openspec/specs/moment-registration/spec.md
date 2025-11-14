# moment-registration Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
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

