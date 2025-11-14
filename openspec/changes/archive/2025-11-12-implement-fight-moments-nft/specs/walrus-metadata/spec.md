# Specification: Walrus Metadata Management

**Capability**: `walrus-metadata`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Walrus metadata management defines how video and image references are stored in the contract. By storing only URIs, Blob IDs, and hashes (not the actual media files), the contract minimizes on-chain storage costs while maintaining verifiability through cryptographic hashes.

---

## ADDED Requirements

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

## Test Coverage

### Unit Tests Required

1. **test_walrus_media_stores_dual_uris**
   - Create WalrusMedia with video and thumbnail URIs
   - Verify both stored correctly

2. **test_walrus_media_stores_optional_metadata**
   - Create WalrusMedia with blob_id and hash
   - Verify optional fields present

3. **test_walrus_media_accepts_no_optional_metadata**
   - Create WalrusMedia with blob_id = None, hash = None
   - Verify moment created successfully

4. **test_register_moment_validates_uri_format**
   - Attempt registration with URI not starting with "walrus://"
   - Verify transaction fails with E_INVALID_WALRUS_URI

5. **test_register_moment_requires_both_uris**
   - Attempt registration with missing video or thumbnail URI
   - Verify transaction fails

6. **test_no_on_chain_validation**
   - Review contract code
   - Verify no HTTP calls or external lookups

---

## Dependencies

### External
- `std::string::String` - For URI storage

### Internal
- None (WalrusMedia is a foundational struct)

---

## Error Codes

- `E_INVALID_WALRUS_URI`: URI empty or invalid format (abort code: 12)

---

## Data Structures

### WalrusMedia
```move
struct WalrusMedia has store, copy, drop {
    video_uri: String,           // Required: "walrus://..."
    thumbnail_uri: String,       // Required: "walrus://..."
    blob_id: Option<String>,     // Optional: Walrus blob identifier
    content_hash: Option<String>, // Optional: Hash for verification
}
```

**Validation Function**:
```move
fun validate_walrus_uri(uri: &String): bool {
    // Check format only, no external verification
    string::starts_with(uri, b"walrus://") && string::length(uri) > 9
}
```

---

## Integration Notes

### Frontend Upload Flow
1. User selects video and thumbnail files
2. Frontend uploads to Walrus via relay:
   - POST to relay with video → get video_uri, blob_id, hash
   - POST to relay with thumbnail → get thumbnail_uri, blob_id, hash
3. Frontend validates upload success
4. Frontend calls `register_moment()` with URIs
5. Contract validates format only

### Walrus Display Flow
1. Frontend queries NFT metadata
2. Marketplace shows `thumbnail_uri` in list view (fast)
3. User clicks NFT → detail page loads `video_uri` (on-demand)
4. Player fetches video from Walrus using URI

### Future: Hash Verification
- Store `content_hash` now for future use
- Post-hackathon: implement hash verification in frontend
- Warn users if hash mismatch detected
