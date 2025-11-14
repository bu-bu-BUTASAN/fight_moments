# Design Document: Fight Moments NFT Contract

**Change ID**: `implement-fight-moments-nft`

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                   Fight Moments Contract                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   AdminCap   │  │MintableMoment│  │FightMomentNFT│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            TransferPolicy<FightMomentNFT>        │  │
│  │         (Shared Object for Future Royalties)     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Object Display Template                 │  │
│  │    (name, description, image_url, video_url)     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Sui Kiosk    │   │   Walrus     │   │  Frontend    │
  │ (Marketplace)│   │(Media Storage)│   │   (dApp)     │
  └──────────────┘   └──────────────┘   └──────────────┘
```

## Key Design Decisions

### 1. Two-Phase Approach: Registration + Mint

**Decision**: Separate "moment registration" (admin) from "NFT minting" (users)

**Rationale**:
- Allows admin to pre-approve which moments can be minted
- Enables supply control per moment (max_supply)
- Reduces gas costs for users (metadata already on-chain)
- Provides quality control (only official moments)

**Trade-offs**:
- ✅ Better control and quality
- ✅ Lower user gas costs
- ❌ Two-step process adds complexity
- ❌ Admin must register before users can mint

**Alternative Considered**: Direct mint by admin distributing to users
- Rejected: Users want ownership experience, not airdrops

### 2. Mandatory Kiosk Integration

**Decision**: NFTs are automatically locked in user's Kiosk upon mint

**Rationale**:
- Follows Sui's recommended pattern for tradeable NFTs
- Prevents accidental transfers without marketplace
- Enables future Transfer Policy enforcement
- Simplifies marketplace implementation

**Trade-offs**:
- ✅ Secure, marketplace-ready by default
- ✅ Future-proof for royalties
- ❌ Users cannot directly transfer NFTs
- ❌ Requires Kiosk creation on first mint (extra gas)

**Implementation**:
```move
// Pseudo-code
public entry fun mint_moment(
    moment_id: ID,
    kiosk: &mut Kiosk,
    kiosk_cap: &KioskOwnerCap,
    ctx: &mut TxContext
) {
    let nft = create_nft(moment_id, ctx);
    kiosk::lock(kiosk, kiosk_cap, transfer_policy, nft);
}
```

### 3. SUI-Only Currency

**Decision**: Only support SUI for Kiosk listings and purchases

**Rationale**:
- Simplifies implementation for hackathon
- Reduces complexity in Transfer Policy
- Native to Sui ecosystem
- Easy for users to understand

**Trade-offs**:
- ✅ Simple, no currency conversion logic
- ✅ Lower gas costs (no token routing)
- ❌ Limited to SUI holders
- ❌ Future expansion needed for USDC, etc.

**Migration Path**: TransferPolicy can be updated later to support additional coins

### 4. Walrus Reference Storage

**Decision**: Store only Walrus URIs/hashes, not media content

**Rationale**:
- Sui storage is expensive for large files
- Walrus designed for blob storage
- Maintains on-chain verifiability via hash
- Frontend handles retrieval

**Data Structure**:
```move
struct WalrusMedia has store, copy, drop {
    video_uri: String,          // walrus://...
    thumbnail_uri: String,      // walrus://... (for list view)
    blob_id: Option<String>,    // Walrus blob identifier
    content_hash: Option<String> // For verification
}
```

**Trade-offs**:
- ✅ Minimal on-chain storage costs
- ✅ Scalable for large media files
- ❌ Dependency on Walrus availability
- ❌ Cannot verify media on-chain

### 5. Dual URI Pattern (Video + Thumbnail)

**Decision**: Store separate URIs for video and thumbnail

**Rationale**:
- Aligns with Suiet wallet display pattern (animation_url → url)
- Improves UX: thumbnails load fast in lists, videos on-demand
- Reduces bandwidth for marketplace browsing
- Better mobile experience

**Display Logic**:
- List view: Show `thumbnail_uri` (image)
- Detail view: Show `video_uri` (video player)
- Wallets: Use Object Display mapping

**Trade-offs**:
- ✅ Better performance and UX
- ✅ Wallet-compatible display
- ❌ Requires 2 Walrus uploads per moment
- ❌ Slightly more complex data model

### 6. Optional Royalty Framework (Not Enforced)

**Decision**: Include royalty data structure but don't enforce in initial version

**Rationale**:
- Future-proofs the design
- Demonstrates hackathon vision
- Avoids complexity in MVP
- TransferPolicy can be updated post-hackathon

**Structure**:
```move
struct RoyaltyConfig has store {
    fighter_a_address: Option<address>,
    fighter_a_bps: u16,  // basis points (0-10000)
    fighter_b_address: Option<address>,
    fighter_b_bps: u16,
    org_address: Option<address>,
    org_bps: u16,
}
```

**Enforcement Strategy** (Future):
1. Update TransferPolicy with royalty rule
2. Kiosk purchase() calls enforce royalty splits
3. Funds automatically distributed on-chain

**Trade-offs**:
- ✅ Shows complete vision
- ✅ Easy to activate later
- ❌ Unused code in MVP
- ❌ Needs testing before production use

### 7. Event-Driven Off-Chain Sync

**Decision**: Emit events for moment creation and minting, consumed by frontend

**Rationale**:
- Enables real-time UI updates
- Reduces need for constant RPC polling
- Standard pattern in Sui dApps
- Allows analytics/monitoring

**Events**:
```move
struct MomentRegistered has copy, drop {
    moment_id: ID,
    match_id: String,
    moment_type: String,
    max_supply: u64,
}

struct NFTMinted has copy, drop {
    nft_id: ID,
    moment_id: ID,
    minter: address,
    timestamp: u64,
}
```

**Trade-offs**:
- ✅ Efficient synchronization
- ✅ Enables analytics
- ❌ Requires event indexer setup
- ❌ Potential for missed events

### 8. Object Display Integration

**Decision**: Implement Sui Object Display standard

**Rationale**:
- Works automatically in Sui wallets
- Explorers show rich metadata
- No custom frontend logic needed for basic display
- Increases discoverability

**Template**:
```move
display.add("name", "Fight Moment #{match_id} - {moment_type}");
display.add("description", "{fighter_a} vs {fighter_b}");
display.add("image_url", "{thumbnail_uri}");
display.add("video_url", "{video_uri}");
display.add("project_url", "https://fightmoments.xyz");
```

**Trade-offs**:
- ✅ Universal wallet/explorer compatibility
- ✅ Professional appearance
- ❌ Template syntax limitations
- ❌ One-time gas cost for Publisher creation

## Data Model

### Core Structs

#### AdminCap
```move
struct AdminCap has key, store {
    id: UID
}
```
- One-time creation in `init()`
- Required for all admin functions
- Transferable for future admin rotation

#### MintableMoment
```move
struct MintableMoment has key, store {
    id: UID,
    match_id: String,
    fighter_a: String,
    fighter_b: String,
    moment_type: String,  // "KO" | "SUBMISSION" | "DECISION" | "HIGHLIGHT"
    media: WalrusMedia,
    max_supply: u64,
    current_supply: u64,
    creator: address,     // For future royalty tracking
    is_active: bool,      // Admin can deactivate
}
```
- Shared object (queryable by anyone)
- Updated by admin when supply changes
- Immutable after creation (except current_supply, is_active)

#### FightMomentNFT
```move
struct FightMomentNFT has key, store {
    id: UID,
    moment_id: ID,        // References MintableMoment
    match_id: String,     // Denormalized for display
    moment_type: String,  // Denormalized for filtering
    fighter_a: String,
    fighter_b: String,
    media: WalrusMedia,
    minted_at: u64,       // Timestamp
    serial_number: u64,   // 1-indexed within moment
    collection_id: String, // For marketplace filtering
}
```
- User-owned (locked in Kiosk)
- Contains all display metadata
- Immutable after mint

#### WalrusMedia
```move
struct WalrusMedia has store, copy, drop {
    video_uri: String,
    thumbnail_uri: String,
    blob_id: Option<String>,
    content_hash: Option<String>,
}
```
- Reusable across moment and NFT
- Copy-able for efficient storage
- Drop-able for cleanup

## Security Considerations

### Access Control
- ✅ `AdminCap` required for all privileged operations
- ✅ Kiosk operations require `KioskOwnerCap`
- ✅ No public functions that modify critical state

### Supply Integrity
- ✅ `current_supply` checked atomically during mint
- ✅ No overflow (u64 supply limits)
- ✅ `is_active` flag prevents minting of disabled moments

### Transfer Safety
- ✅ NFTs locked in Kiosk (cannot be transferred directly)
- ✅ Transfer Policy in place for future enforcement
- ✅ No arbitrary object deletion

### Input Validation
- ✅ Non-empty string checks for match_id, moment_type
- ✅ Walrus URI format validation (starts with "walrus://")
- ✅ Royalty BPS sum ≤ reasonable limit (e.g., 2000 = 20%)

## Performance Considerations

### Gas Optimization
- Shared objects for moments (avoid duplication)
- Minimal struct sizes (strings for IDs, not large blobs)
- Batch operations where possible (PTB-friendly design)
- Event payloads kept concise

### Scalability
- No unbounded vectors (fixed supply per moment)
- No global state iteration (moments queryable by ID)
- Kiosk handles marketplace scaling (not in contract)

## Testing Strategy

### Unit Tests
- [ ] Admin initialization
- [ ] Moment registration (success and failure cases)
- [ ] User minting (with/without Kiosk)
- [ ] Supply limit enforcement
- [ ] Kiosk locking mechanics
- [ ] Transfer Policy creation
- [ ] Object Display template
- [ ] Event emission

### Integration Tests (Future)
- Frontend + Contract end-to-end
- Kiosk listing and purchase flows
- Walrus upload + Contract registration

## Deployment Checklist

1. **Pre-Deployment**
   - [ ] All unit tests passing
   - [ ] Sui CLI version compatible
   - [ ] Dependencies locked in Move.toml
   - [ ] Gas estimation for typical operations

2. **Deployment**
   - [ ] Deploy to testnet first
   - [ ] Verify AdminCap ownership
   - [ ] Confirm TransferPolicy creation
   - [ ] Test Object Display in wallet

3. **Post-Deployment**
   - [ ] Document package ID
   - [ ] Document TransferPolicy ID
   - [ ] Update frontend configuration
   - [ ] Monitor events for errors

## Future Enhancements

1. **Royalty Enforcement**
   - Activate Transfer Policy rules
   - Implement automatic split logic
   - Test with real transactions

2. **Advanced Features**
   - Batch minting for airdrops
   - Moment bundles (multi-NFT packs)
   - Rarity tiers
   - Time-limited minting windows

3. **Optimizations**
   - Compressed NFT variants for lower gas
   - Lazy minting (mint on first transfer)
   - Cross-chain bridges (if needed)

## References

- [Sui Kiosk Documentation](https://docs.sui.io/standards/kiosk)
- [Sui Transfer Policy](https://blog.sui.io/nft-standards-royalties/)
- [Walrus SDK](https://sdk.mystenlabs.com/walrus)
- [Object Display Standard](https://docs.sui.io/standards/display)
