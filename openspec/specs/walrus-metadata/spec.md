# walrus-metadata Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
### Requirement: Dual URI Storage (Video + Thumbnail)

**Priority**: CRITICAL  
**Source**: RQ-WALRUS-01, RQ-WALRUS-02

The system MUST store two separate Walrus URIs: one for video and one for thumbnail, enabling efficient display patterns.

#### Scenario: Store video and thumbnail URIs

**Given**:
- Video uploaded to Walrus: "walrus://abc123..."
- Thumbnail uploaded to Walrus: "walrus://def456..."

**When**:
- Admin registers a moment with both URIs

**Then**:
- A `WalrusMedia` struct is created with:
  - `video_uri = "walrus://abc123..."`
  - `thumbnail_uri = "walrus://def456..."`
- Both URIs are stored in the `MintableMoment`
- Both URIs are copied to each minted NFT

**Verification**:
```bash
sui client call --function get_moment_metadata --args <moment-id>
# Should return both video_uri and thumbnail_uri
```

---

#### Scenario: Thumbnail used for list views, video for details

**Given**:
- An NFT with video_uri and thumbnail_uri

**When**:
- Marketplace displays NFT list

**Then**:
- Marketplace uses `thumbnail_uri` for fast loading
- Clicking NFT shows detail view with `video_uri`

**Verification**:
- Marketplace UI shows thumbnails in list
- Detail page plays video

**Note**: This is frontend behavior, but enabled by contract's dual URI design.

---

### Requirement: Store Blob ID and Hash (Optional but Recommended)

**Priority**: MEDIUM  
**Source**: RQ-WALRUS-01, RQ-WALRUS-02

The system SHALL store Walrus Blob ID and content hash for verification purposes.

#### Scenario: Store blob metadata for verification

**Given**:
- Walrus upload returns:
  - blob_id = "blob-12345"
  - content_hash = "sha256:abcdef..."

**When**:
- Admin registers moment with these values

**Then**:
- `WalrusMedia` stores:
  - `blob_id = Some("blob-12345")`
  - `content_hash = Some("sha256:abcdef...")`
- These values are available for verification

**Verification**:
- Query WalrusMedia struct
- blob_id and content_hash present

---

#### Scenario: Blob metadata is optional

**Given**:
- Admin registers moment without providing blob_id or hash

**When**:
- Admin calls `register_moment()` with `blob_id = None, content_hash = None`

**Then**:
- Moment is registered successfully
- `WalrusMedia` has `blob_id = None, content_hash = None`
- Video and thumbnail URIs are still required

**Verification**:
- Moment created without blob metadata

---

### Requirement: No On-Chain Media Validation

**Priority**: CRITICAL  
**Source**: RQ-WALRUS-03, NFR-02

The contract MUST NOT attempt to verify Walrus content existence or reachability. Validation is limited to URI format checks only.

#### Scenario: Contract validates URI format only

**Given**:
- Admin provides URIs starting with "walrus://"

**When**:
- Admin calls `register_moment()`

**Then**:
- Contract checks: `uri.starts_with("walrus://")`
- Contract does NOT attempt to:
  - Fetch URI content
  - Verify blob exists in Walrus
  - Validate hash matches content
- Frontend/relay responsible for pre-upload verification

**Verification**:
- Compile code: no external HTTP calls in contract
- Unit test: invalid prefix rejected, valid prefix accepted

---

#### Scenario: Off-chain verification (Frontend responsibility)

**Given**:
- Frontend uploads video to Walrus
- Walrus relay returns URI and hash

**When**:
- Frontend submits URI to contract

**Then**:
- Frontend has already verified upload success
- Contract trusts frontend's validation
- Contract only checks format

**Verification**:
- Frontend code shows upload verification
- Contract code shows no verification logic

**Note**: This is an architectural decision, not a contract requirement.

---

### Requirement: Both URIs Required (Not Optional)

**Priority**: CRITICAL  
**Source**: RQ-WALRUS-03

Both video_uri and thumbnail_uri MUST be provided. Empty or missing URIs MUST cause registration to fail.

#### Scenario: Registration fails with missing video URI

**Given**:
- Admin provides thumbnail_uri but video_uri = ""

**When**:
- Admin calls `register_moment()`

**Then**:
- Transaction fails with error `E_INVALID_WALRUS_URI`
- No moment is created

**Verification**:
- Transaction aborted

---

#### Scenario: Registration fails with missing thumbnail URI

**Given**:
- Admin provides video_uri but thumbnail_uri = ""

**When**:
- Admin calls `register_moment()`

**Then**:
- Transaction fails with error `E_INVALID_WALRUS_URI`
- No moment is created

**Verification**:
- Transaction aborted

---

