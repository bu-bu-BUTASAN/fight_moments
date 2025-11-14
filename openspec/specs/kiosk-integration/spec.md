# kiosk-integration Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
### Requirement: NFTs Compatible with Kiosk Operations

**Priority**: CRITICAL  
**Source**: RQ-KIOSK-01

Fight Moment NFTs MUST have the abilities required by Sui Kiosk (`key` + `store`) to support place, lock, list, and purchase operations.

#### Scenario: NFT can be placed in Kiosk

**Given**:
- A `FightMomentNFT` struct is defined with `has key, store`
- User owns an NFT (hypothetically, if not locked)

**When**:
- User attempts to call `kiosk::place()` with the NFT

**Then**:
- The operation succeeds (if NFT not already locked)
- The NFT is placed in the Kiosk

**Verification**:
- Compile-time: struct has correct abilities
- Runtime: place operation succeeds

---

#### Scenario: Locked NFT remains in Kiosk

**Given**:
- An NFT is locked in a Kiosk (via mint_and_lock)

**When**:
- User attempts to withdraw the NFT using `kiosk::take()`

**Then**:
- The operation fails (locked items cannot be withdrawn)
- The NFT remains in the Kiosk

**Verification**:
```bash
sui client call --function kiosk::take --args <kiosk-id> <kiosk-cap> <nft-id>
# Should abort - item is locked
```

---

### Requirement: Price Management via Kiosk (Not NFT)

**Priority**: CRITICAL  
**Source**: RQ-KIOSK-02, RQ-NFT-05

NFT objects MUST NOT store price or sale status. All pricing is managed by Kiosk's list mechanism.

#### Scenario: NFT does not contain price field

**Given**:
- An NFT is minted and locked in Kiosk

**When**:
- NFT metadata is queried

**Then**:
- The NFT struct contains NO price field
- The NFT struct contains NO sale_status field
- Metadata only includes match/moment identifiers and media URIs

**Verification**:
- Review `FightMomentNFT` struct definition
- No `price` or `sale_status` fields present

---

#### Scenario: User lists NFT with price in Kiosk

**Given**:
- User owns an NFT locked in their Kiosk
- User wants to sell for 100 SUI

**When**:
- User calls `kiosk::list<FightMomentNFT>(kiosk, kiosk_cap, nft_id, 100_000_000_000)`
  - Price in MIST: 100 SUI = 100 * 10^9 MIST

**Then**:
- The NFT is marked as listed in the Kiosk
- The price (100 SUI) is stored in the Kiosk's listing data
- The NFT object itself is unchanged

**Verification**:
```bash
# Query Kiosk listings
sui client object <kiosk-id>
# Should show NFT listed at 100 SUI
```

---

#### Scenario: Buyer purchases NFT from Kiosk

**Given**:
- An NFT is listed in seller's Kiosk at 100 SUI
- Buyer has sufficient SUI balance

**When**:
- Buyer calls `kiosk::purchase<FightMomentNFT>()`
- Buyer provides 100 SUI payment

**Then**:
- The NFT is transferred to buyer's Kiosk (locked)
- Seller receives 100 SUI
- Listing is removed from seller's Kiosk

**Verification**:
- NFT now in buyer's Kiosk
- Seller's SUI balance increased

---

### Requirement: Marketplace Display Metadata

**Priority**: CRITICAL  
**Source**: RQ-KIOSK-03, RQ-MINT-07

NFTs MUST contain sufficient metadata for marketplace display without requiring additional on-chain lookups.

#### Scenario: NFT includes marketplace identifiers

**Given**:
- An NFT is minted from a moment

**When**:
- Marketplace queries NFT metadata

**Then**:
- The NFT provides:
  - `collection_id`: Identifies this as a Fight Moments NFT
  - `match_id`: Enables filtering by match
  - `moment_type`: Enables filtering by type (KO, SUBMISSION, etc.)
  - `thumbnail_uri`: Fast loading for list views
  - `video_uri`: Detail view display

**Verification**:
- Query NFT via RPC
- All fields present and correct

---

#### Scenario: Marketplace filters NFTs by collection

**Given**:
- Multiple NFT types exist on Sui (Fight Moments, other collections)
- All Fight Moments NFTs have `collection_id = "fight-moments-v1"`

**When**:
- Marketplace queries Kiosks for listed items
- Marketplace filters by `collection_id == "fight-moments-v1"`

**Then**:
- Only Fight Moments NFTs are displayed
- Other collections are excluded

**Verification**:
- Marketplace UI shows only Fight Moments NFTs

---

### Requirement: SUI-Only Currency

**Priority**: CRITICAL  
**Source**: RQ-INIT-06, RQ-POLICY-03

Kiosk listings and purchases MUST use SUI as the only accepted currency. No multi-currency support required.

#### Scenario: Listings denominated in SUI

**Given**:
- User lists an NFT in Kiosk

**When**:
- User specifies price = 100 SUI

**Then**:
- The listing is denominated in SUI (MIST)
- No other coin types accepted

**Verification**:
- Kiosk listing shows SUI price

---

#### Scenario: Purchase requires SUI payment

**Given**:
- An NFT is listed for 100 SUI
- Buyer has USDC but no SUI

**When**:
- Buyer attempts to purchase with USDC

**Then**:
- The transaction fails (wrong coin type)
- Only SUI payment accepted

**Verification**:
- Purchase with non-SUI coin aborts

---

