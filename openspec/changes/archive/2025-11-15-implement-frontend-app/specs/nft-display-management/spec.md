# nft-display-management Specification

## ADDED Requirements

### Requirement: Kiosk NFT Display

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.3, Requirements FE-RQ-DISPLAY-01/02/03/04

Users MUST be able to view all NFTs locked in their Kiosk, NOT direct wallet ownership.

#### Scenario: Display user's Kiosk NFTs

**Given**:
- User's wallet is connected (address = 0xABC...)
- User owns a KioskOwnerCap (kiosk_id = 0xDEF...)
- User's Kiosk contains 3 FightMomentNFT objects:
  - NFT A: match_id="UFC300-001", type=KO, serial=1
  - NFT B: match_id="UFC300-002", type=Submission, serial=5
  - NFT C: match_id="UFC300-001", type=KO, serial=2

**When**:
- User navigates to `/my-nfts` page
- Frontend queries user's KioskOwnerCap to get kiosk_id
- Frontend queries Kiosk contents for FightMomentNFT objects

**Then**:
- UI displays all 3 NFTs from Kiosk
- Direct wallet NFTs (if any) are NOT displayed
- For each NFT, display:
  - Thumbnail image from `thumbnail_uri`
  - match_id
  - moment_type
  - serial_number
  - fighter names
  - minted_at timestamp
  - Listing status (listed/not listed)

**Verification**:
```typescript
// Get user's Kiosk
const kioskCaps = await suiClient.getOwnedObjects({
  owner: userAddress,
  filter: { StructType: '0x2::kiosk::KioskOwnerCap' },
});
const kioskId = kioskCaps.data[0].data.kiosk_id;

// Get Kiosk contents
const kioskContents = await suiClient.getDynamicFields({ parentId: kioskId });
const nfts = kioskContents.data.filter(
  obj => obj.objectType.includes('FightMomentNFT')
);

expect(nfts).toHaveLength(3);
```

---

#### Scenario: No NFTs in Kiosk

**Given**:
- User has a Kiosk but no NFTs

**When**:
- User navigates to `/my-nfts` page

**Then**:
- UI displays empty state message
- Message: "まだ NFT を保有していません"
- Link to moments page: "Mint してみる"

**Verification**:
```typescript
expect(screen.getByText('まだ NFT を保有していません')).toBeInTheDocument();
expect(screen.getByText('Mint してみる')).toHaveAttribute('href', '/moments');
```

---

#### Scenario: User has no Kiosk

**Given**:
- User's wallet is connected
- User does NOT own a KioskOwnerCap

**When**:
- User navigates to `/my-nfts` page

**Then**:
- UI displays message: "Kiosk がありません。最初の NFT を mint してください"
- Link to moments page

**Verification**:
```typescript
expect(screen.getByText(/Kiosk がありません/)).toBeInTheDocument();
```

---

### Requirement: NFT Detail Display

**Priority**: HIGH  
**Related**: `docs/frontend-design.md` Section 3.3

Users MUST be able to view detailed NFT information including video playback.

#### Scenario: View NFT details with video

**Given**:
- User selects an NFT from their list
- NFT has:
  - video_uri = "walrus://vid123"
  - thumbnail_uri = "walrus://thumb456"
  - match_id = "UFC300-001"

**When**:
- User clicks on NFT card
- Detail view/modal opens

**Then**:
- Video player displays using `video_uri`
- Video is playable from Walrus storage
- Metadata displayed:
  - match_id
  - fighter_a vs fighter_b
  - moment_type
  - serial_number (e.g., "#1 of 1000")
  - minted_at (formatted timestamp)
  - collection_id

**Verification**:
```typescript
const videoPlayer = screen.getByTestId('video-player');
expect(videoPlayer).toHaveAttribute('src', expect.stringContaining('walrus://vid123'));

expect(screen.getByText('UFC300-001')).toBeInTheDocument();
expect(screen.getByText(/#1 of 1000/)).toBeInTheDocument();
```

---

### Requirement: NFT Listing Functionality

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.3, Requirement FE-RQ-DISPLAY-04

Users MUST be able to list their NFTs for sale in the Kiosk marketplace.

#### Scenario: List NFT with price

**Given**:
- User owns NFT in Kiosk (nft_id = 0x456...)
- NFT is NOT currently listed
- User's wallet is connected

**When**:
- User clicks "価格を付ける" button on NFT card
- Listing form appears
- User enters price: 100 SUI
- User submits form
- Frontend constructs PTB calling `kiosk::list`
- User signs transaction

**Then**:
- Transaction succeeds
- NFT is listed in Kiosk with price = 100 SUI
- NFT card now shows:
  - Badge: "出品中"
  - Price: "100 SUI"
  - "出品を取り消す" button (optional)
- NFT appears in marketplace

**Verification**:
```typescript
// Construct listing PTB
const tx = new Transaction();
tx.moveCall({
  target: '0x2::kiosk::list',
  arguments: [
    tx.object(kioskId),
    tx.object(kioskCapId),
    tx.object(nftId),
    tx.pure.u64(100_000_000_000), // 100 SUI in MIST
  ],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

const result = await signAndExecuteTransaction({ transaction: tx });
expect(result.effects.status.status).toBe('success');
```

---

#### Scenario: Update listing price

**Given**:
- User has an NFT listed at 100 SUI

**When**:
- User clicks "価格を変更" button
- User enters new price: 150 SUI
- User submits

**Then**:
- Transaction delists old listing
- Transaction creates new listing with 150 SUI
- NFT now shows updated price

**Verification**:
```typescript
// Delist and relist in one PTB
const tx = new Transaction();
tx.moveCall({
  target: '0x2::kiosk::delist',
  arguments: [tx.object(kioskId), tx.object(kioskCapId), tx.object(nftId)],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});
tx.moveCall({
  target: '0x2::kiosk::list',
  arguments: [
    tx.object(kioskId),
    tx.object(kioskCapId),
    tx.object(nftId),
    tx.pure.u64(150_000_000_000),
  ],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});
```

---

#### Scenario: Delist NFT

**Given**:
- User has an NFT listed at 100 SUI

**When**:
- User clicks "出品を取り消す" button
- User confirms action
- Frontend constructs PTB calling `kiosk::delist`

**Then**:
- Transaction succeeds
- NFT is delisted from marketplace
- NFT card no longer shows "出品中" badge
- "価格を付ける" button is available again

**Verification**:
```typescript
const tx = new Transaction();
tx.moveCall({
  target: '0x2::kiosk::delist',
  arguments: [tx.object(kioskId), tx.object(kioskCapId), tx.object(nftId)],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

await signAndExecuteTransaction({ transaction: tx });
expect(screen.queryByText('出品中')).not.toBeInTheDocument();
```

---

### Requirement: Prohibited Actions Removal

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.3, Requirements FE-RQ-DISPLAY-02/03

UI MUST NOT display buttons for prohibited Kiosk operations.

#### Scenario: No "Kioskに入れる" button

**Given**:
- NFTs are automatically locked in Kiosk during mint

**When**:
- User views their NFTs in `/my-nfts`

**Then**:
- "Kioskに入れる" button is NOT displayed
- UI does NOT suggest placing NFTs in Kiosk (already there)

**Verification**:
```typescript
expect(screen.queryByText('Kioskに入れる')).not.toBeInTheDocument();
expect(screen.queryByText('Place in Kiosk')).not.toBeInTheDocument();
```

---

#### Scenario: No "Kioskから出す" button

**Given**:
- NFTs are locked and cannot be withdrawn from Kiosk

**When**:
- User views their NFTs in `/my-nfts`

**Then**:
- "Kioskから出す" button is NOT displayed
- "Take" or "Withdraw" buttons are NOT displayed
- UI does NOT suggest removing NFTs from Kiosk

**Verification**:
```typescript
expect(screen.queryByText('Kioskから出す')).not.toBeInTheDocument();
expect(screen.queryByText('Take')).not.toBeInTheDocument();
expect(screen.queryByText('Withdraw')).not.toBeInTheDocument();
```

---

### Requirement: Thumbnail Usage in List View

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 6

List views MUST use thumbnail_uri for performance, NOT video_uri.

#### Scenario: Thumbnail displayed in list view

**Given**:
- User has multiple NFTs in their Kiosk

**When**:
- User views `/my-nfts` page (list view)

**Then**:
- Each NFT card displays thumbnail from `thumbnail_uri`
- Video files are NOT loaded in list view
- Thumbnails load quickly
- Only when clicking NFT for details is `video_uri` loaded

**Verification**:
```typescript
const nftCards = screen.getAllByTestId('nft-card');
nftCards.forEach(card => {
  const img = within(card).getByRole('img');
  expect(img).toHaveAttribute('src', expect.stringContaining('thumbnail'));
  expect(img).not.toHaveAttribute('src', expect.stringContaining('video'));
});
```
