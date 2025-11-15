# marketplace-integration Specification

## ADDED Requirements

### Requirement: Listed NFT Discovery

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.4

Users MUST be able to discover all Fight Moment NFTs listed for sale across all Kiosks.

#### Scenario: Display all listed NFTs

**Given**:
- 5 Fight Moment NFTs are listed across different Kiosks:
  - NFT A: kiosk_1, price=50 SUI, match="UFC300-001", type=KO
  - NFT B: kiosk_2, price=100 SUI, match="UFC300-002", type=Submission
  - NFT C: kiosk_1, price=75 SUI, match="UFC300-001", type=KO
  - NFT D: kiosk_3, price=200 SUI, match="UFC300-003", type=Decision
  - NFT E: kiosk_2, price=150 SUI, match="UFC300-001", type=KO
- 3 other NFTs are in Kiosks but NOT listed

**When**:
- User navigates to `/marketplace` page
- Frontend queries Sui for listed Fight Moment NFTs
- Filter by collection_id = "fight-moments-v1"

**Then**:
- UI displays all 5 listed NFTs only
- Unlisted NFTs are NOT displayed
- For each NFT, display:
  - Thumbnail from `thumbnail_uri`
  - match_id
  - moment_type
  - serial_number
  - Price in SUI
  - Seller's Kiosk ID (or truncated address)
  - "Buy" button

**Verification**:
```typescript
// Query listed NFTs via Kiosk events or dynamic fields
const listedNFTs = await queryListedNFTs({
  collectionId: 'fight-moments-v1',
});

expect(listedNFTs).toHaveLength(5);
listedNFTs.forEach(nft => {
  expect(nft).toHaveProperty('price');
  expect(nft).toHaveProperty('kioskId');
});
```

---

#### Scenario: Empty marketplace

**Given**:
- No Fight Moment NFTs are listed for sale

**When**:
- User navigates to `/marketplace`

**Then**:
- UI displays empty state message
- Message: "現在出品中の NFT はありません"
- Suggestion: "自分の NFT を出品してみませんか？"
- Link to `/my-nfts`

**Verification**:
```typescript
expect(screen.getByText('現在出品中の NFT はありません')).toBeInTheDocument();
expect(screen.getByText('自分の NFT を出品してみませんか？')).toBeInTheDocument();
```

---

### Requirement: NFT Purchase Execution

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.4

Users MUST be able to purchase listed NFTs using Kiosk purchase mechanism.

#### Scenario: Successful NFT purchase

**Given**:
- NFT is listed in seller's Kiosk (kiosk_id = 0xSELLER)
- NFT price = 100 SUI
- Buyer's wallet is connected with >= 100 SUI balance
- Buyer has a Kiosk (kiosk_id = 0xBUYER)

**When**:
- Buyer clicks "Buy" button on NFT card
- Confirmation modal appears showing price
- Buyer confirms purchase
- Frontend constructs PTB:
  1. Take payment coin (100 SUI) from buyer
  2. Call `kiosk::purchase` to buy NFT
  3. Lock purchased NFT in buyer's Kiosk
- Buyer signs transaction

**Then**:
- Transaction succeeds
- 100 SUI transferred from buyer to seller
- NFT transferred from seller's Kiosk to buyer's Kiosk
- NFT is automatically locked in buyer's Kiosk
- Success message: "NFT を購入しました！"
- Marketplace list is refreshed (NFT removed)
- Buyer's `/my-nfts` shows new NFT

**Verification**:
```typescript
// Construct purchase PTB
const tx = new Transaction();

// Split coin for payment
const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(100_000_000_000)]);

// Purchase from seller's Kiosk
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [
    tx.object(sellerKioskId),
    tx.object(nftId),
    paymentCoin,
  ],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

// Lock in buyer's Kiosk
tx.moveCall({
  target: '0x2::kiosk::lock',
  arguments: [
    tx.object(buyerKioskId),
    tx.object(buyerKioskCapId),
    tx.object(TRANSFER_POLICY_ID),
    nft,
  ],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

// Confirm transfer request (if required by policy)
tx.moveCall({
  target: '0x2::transfer_policy::confirm_request',
  arguments: [
    tx.object(TRANSFER_POLICY_ID),
    transferRequest,
  ],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

const result = await signAndExecuteTransaction({ transaction: tx });
expect(result.effects.status.status).toBe('success');
```

---

#### Scenario: Purchase fails - insufficient balance

**Given**:
- NFT price = 100 SUI
- Buyer's wallet has only 50 SUI

**When**:
- Buyer attempts to purchase

**Then**:
- "Buy" button shows warning icon
- Tooltip: "残高が不足しています"
- Transaction would fail if attempted
- Error message: "SUI が不足しています。残高を確認してください"

**Verification**:
```typescript
const buyButton = screen.getByRole('button', { name: /Buy/ });
expect(buyButton).toHaveAttribute('aria-disabled', 'true');
expect(screen.getByText('残高が不足しています')).toBeInTheDocument();
```

---

#### Scenario: Purchase by buyer without Kiosk

**Given**:
- Buyer does NOT have a Kiosk
- NFT is listed for 100 SUI

**When**:
- Buyer clicks "Buy" button
- Frontend detects no Kiosk

**Then**:
- PTB creates new Kiosk for buyer
- PTB purchases NFT
- PTB locks NFT in newly created Kiosk
- PTB transfers KioskOwnerCap to buyer
- All in ONE transaction (atomic)

**Verification**:
```typescript
// Construct PTB for purchase + create Kiosk
const tx = new Transaction();

// Create Kiosk
const [kiosk, kioskCap] = tx.moveCall({
  target: '0x2::kiosk::new',
  arguments: [],
});

// Split payment
const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(100_000_000_000)]);

// Purchase
const [nft, transferRequest] = tx.moveCall({
  target: '0x2::kiosk::purchase',
  arguments: [tx.object(sellerKioskId), tx.object(nftId), paymentCoin],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

// Lock in new Kiosk
tx.moveCall({
  target: '0x2::kiosk::lock',
  arguments: [kiosk, kioskCap, tx.object(TRANSFER_POLICY_ID), nft],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

// Confirm transfer
tx.moveCall({
  target: '0x2::transfer_policy::confirm_request',
  arguments: [tx.object(TRANSFER_POLICY_ID), transferRequest],
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
});

// Transfer KioskOwnerCap
tx.transferObjects([kioskCap], tx.pure.address(buyerAddress));
```

---

### Requirement: Marketplace Filtering and Sorting

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 3.4

Users MUST be able to filter and sort listed NFTs for better discovery.

#### Scenario: Filter by moment type

**Given**:
- Marketplace has NFTs of different types (KO, Submission, Decision)

**When**:
- User selects "KO" from moment type filter

**Then**:
- UI displays only NFTs with moment_type = KO
- Other types are hidden
- Filter can be cleared to show all

**Verification**:
```typescript
const typeFilter = screen.getByLabelText('Moment Type');
fireEvent.change(typeFilter, { target: { value: 'KO' } });

const visibleNFTs = screen.getAllByTestId('marketplace-card');
visibleNFTs.forEach(card => {
  expect(within(card).getByText('KO')).toBeInTheDocument();
});
```

---

#### Scenario: Sort by price

**Given**:
- Marketplace has NFTs with various prices

**When**:
- User selects "Price: Low to High" from sort dropdown

**Then**:
- NFTs are displayed in ascending price order
- Cheapest NFT appears first
- Most expensive NFT appears last

**Verification**:
```typescript
const sortSelect = screen.getByLabelText('Sort by');
fireEvent.change(sortSelect, { target: { value: 'price-asc' } });

const prices = screen.getAllByTestId('nft-price').map(el => 
  parseInt(el.textContent.replace(/[^\d]/g, ''))
);

expect(prices).toEqual([...prices].sort((a, b) => a - b));
```

---

#### Scenario: Filter by match ID

**Given**:
- Marketplace has NFTs from multiple matches

**When**:
- User enters "UFC300-001" in match ID search

**Then**:
- Only NFTs with match_id containing "UFC300-001" are displayed
- Search is case-insensitive

**Verification**:
```typescript
const searchInput = screen.getByPlaceholderText('Search by Match ID');
fireEvent.change(searchInput, { target: { value: 'UFC300-001' } });

const visibleNFTs = screen.getAllByTestId('marketplace-card');
visibleNFTs.forEach(card => {
  expect(within(card).getByText(/UFC300-001/i)).toBeInTheDocument();
});
```

---

### Requirement: Real-time Marketplace Updates

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 6

Marketplace MUST reflect current listings after purchases or new listings.

#### Scenario: Marketplace updates after purchase

**Given**:
- NFT A is displayed in marketplace
- Buyer purchases NFT A

**When**:
- Purchase transaction completes
- React Query cache is invalidated

**Then**:
- Marketplace is refetched
- NFT A is removed from marketplace list
- Other NFTs remain displayed
- UI updates without manual refresh

**Verification**:
```typescript
const { mutate } = useMutation({
  mutationFn: purchaseNFT,
  onSuccess: () => {
    queryClient.invalidateQueries(['marketplace']);
  },
});

await mutate({ nftId, kioskId, price });

// NFT should disappear
await waitFor(() => {
  expect(screen.queryByTestId(`nft-${nftId}`)).not.toBeInTheDocument();
});
```

---

#### Scenario: Marketplace updates after new listing

**Given**:
- User lists an NFT from `/my-nfts`

**When**:
- Listing transaction completes
- User navigates to `/marketplace`

**Then**:
- Newly listed NFT appears in marketplace
- Displayed with correct price and details

**Verification**:
```typescript
// After listing
const { mutate } = useMutation({
  mutationFn: listNFT,
  onSuccess: () => {
    queryClient.invalidateQueries(['marketplace']);
  },
});

await mutate({ nftId, price: 100 });

// Check marketplace
const marketplaceNFTs = screen.getAllByTestId('marketplace-card');
expect(marketplaceNFTs).toContainEqual(
  expect.objectContaining({ id: nftId, price: 100 })
);
```

---

### Requirement: Collection ID Filtering

**Priority**: HIGH  
**Related**: `docs/frontend-design.md` Section 3.4, `openspec/specs/user-mint/spec.md`

Marketplace MUST only display Fight Moment NFTs, not other collections.

#### Scenario: Filter by collection_id

**Given**:
- Multiple NFT collections exist on Sui
- Some Fight Moment NFTs (collection_id = "fight-moments-v1")
- Other NFTs from different collections

**When**:
- Frontend queries listed NFTs

**Then**:
- Only NFTs with collection_id = "fight-moments-v1" are displayed
- Other collections' NFTs are NOT displayed
- Query uses collection_id as filter

**Verification**:
```typescript
const marketplaceNFTs = await queryListedNFTs({
  filter: { collectionId: 'fight-moments-v1' },
});

marketplaceNFTs.forEach(nft => {
  expect(nft.collection_id).toBe('fight-moments-v1');
});
```
