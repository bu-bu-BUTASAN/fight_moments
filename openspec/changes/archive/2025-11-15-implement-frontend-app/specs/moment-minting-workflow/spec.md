# moment-minting-workflow Specification

## ADDED Requirements

### Requirement: Moment List Display

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.2

Users MUST be able to view all mintable moments with their details and remaining supply.

#### Scenario: Display all active moments

**Given**:
- 3 MintableMoment objects exist on Sui:
  - Moment A: match_id="UFC300-001", type=KO, max=1000, current=100, active=true
  - Moment B: match_id="UFC300-002", type=Submission, max=500, current=500, active=true
  - Moment C: match_id="UFC300-003", type=Decision, max=100, current=0, active=false

**When**:
- User navigates to `/moments` page
- Frontend queries Sui RPC for all MintableMoment objects

**Then**:
- UI displays 2 active moments (A and B)
- Inactive moment C is NOT displayed
- For each moment, display:
  - match_id
  - moment_type
  - Remaining supply: "900 / 1000" (for A), "0 / 500" (for B - sold out)
  - Thumbnail image from `thumbnail_uri`
  - Mint button (enabled for A, disabled for B)

**Verification**:
```typescript
// Query moments
const moments = await suiClient.getOwnedObjects({
  filter: { StructType: `${PACKAGE_ID}::fight_moments::MintableMoment` },
});

// Filter active moments
const activeMoments = moments.data.filter(m => m.data.is_active === true);
expect(activeMoments).toHaveLength(2);
```

---

#### Scenario: Thumbnail image display

**Given**:
- A moment has `thumbnail_uri = "walrus://thumb123"`

**When**:
- Moment list is displayed

**Then**:
- Thumbnail is rendered using Walrus viewer
- Image loads from Walrus storage
- Fallback placeholder shown during loading
- Alt text describes the moment

**Verification**:
```typescript
const thumbnail = screen.getByAltText(/UFC300-001/);
expect(thumbnail).toHaveAttribute('src', expect.stringContaining('walrus://thumb123'));
```

---

### Requirement: Kiosk Detection and Creation

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.2, Requirements FE-RQ-KIOSK-01/02/03

Frontend MUST detect if user has a Kiosk and create one if necessary during first mint.

#### Scenario: User has no Kiosk - first mint

**Given**:
- User's wallet is connected (address = 0xABC...)
- User does NOT own a KioskOwnerCap
- A mintable moment exists (moment_id = 0x123...)

**When**:
- User clicks "Mint" button
- Frontend queries user's owned objects
- No KioskOwnerCap found
- Frontend constructs PTB with `create_kiosk_and_mint`

**Then**:
- PTB creates new Kiosk
- PTB creates new KioskOwnerCap
- PTB mints NFT and locks it in the new Kiosk
- PTB transfers KioskOwnerCap to user
- All in ONE transaction (atomic)
- Transaction succeeds
- User now owns KioskOwnerCap
- NFT is locked in Kiosk

**Verification**:
```typescript
// Construct PTB for first mint
const tx = new Transaction();
const [kiosk, kioskCap] = tx.moveCall({
  target: '0x2::kiosk::new',
  arguments: [],
});
tx.moveCall({
  target: `${PACKAGE_ID}::fight_moments::mint_and_lock`,
  arguments: [
    tx.object(momentId),
    kiosk,
    kioskCap,
  ],
});
tx.transferObjects([kioskCap], tx.pure.address(userAddress));

const result = await signAndExecuteTransaction({ transaction: tx });
expect(result.effects.status.status).toBe('success');

// Verify user now has KioskOwnerCap
const userObjects = await suiClient.getOwnedObjects({
  owner: userAddress,
  filter: { StructType: '0x2::kiosk::KioskOwnerCap' },
});
expect(userObjects.data).toHaveLength(1);
```

---

#### Scenario: User has existing Kiosk - subsequent mint

**Given**:
- User owns a KioskOwnerCap (kiosk_id = 0xDEF...)
- User has previously minted at least one NFT
- A mintable moment exists

**When**:
- User clicks "Mint" button
- Frontend queries user's owned objects
- KioskOwnerCap is found
- Frontend constructs PTB with `mint_and_lock` using existing Kiosk

**Then**:
- PTB mints NFT using existing Kiosk
- PTB locks NFT in existing Kiosk
- No new Kiosk is created
- Transaction succeeds
- NFT is added to existing Kiosk

**Verification**:
```typescript
// Construct PTB for subsequent mint
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::fight_moments::mint_and_lock`,
  arguments: [
    tx.object(momentId),
    tx.object(kioskId),
    tx.object(kioskCapId),
  ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
expect(result.effects.status.status).toBe('success');
```

---

### Requirement: Mint Transaction Execution

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.2, `openspec/specs/user-mint/spec.md`

Users MUST be able to mint NFTs from available moments through wallet signature.

#### Scenario: Successful NFT mint

**Given**:
- User's wallet is connected
- User has a Kiosk (kiosk_id = 0xDEF...)
- A moment exists with current_supply < max_supply
- Moment is active

**When**:
- User clicks "Mint" button on moment card
- Frontend constructs PTB calling `mint_and_lock`
- User signs transaction in wallet
- Transaction is executed

**Then**:
- Transaction succeeds
- New FightMomentNFT is created
- NFT is locked in user's Kiosk
- Moment's current_supply is incremented
- NFTMinted event is emitted
- Success message: "NFT を mint しました！"
- Moment list is refreshed (supply updated)

**Verification**:
```typescript
const initialSupply = moment.current_supply;

await mintNFT(momentId, kioskId, kioskCapId);

const updatedMoment = await suiClient.getObject({ id: momentId });
expect(updatedMoment.data.current_supply).toBe(initialSupply + 1);
```

---

#### Scenario: Mint fails - supply exhausted

**Given**:
- A moment has max_supply = 100, current_supply = 100

**When**:
- User attempts to mint

**Then**:
- Mint button is disabled
- Tooltip displays: "売り切れ"
- If user somehow triggers mint, transaction fails with E_SUPPLY_EXHAUSTED
- Error message displayed: "このモーメントは売り切れました"

**Verification**:
```typescript
const mintButton = screen.getByRole('button', { name: /Mint/ });
expect(mintButton).toBeDisabled();
expect(screen.getByText('売り切れ')).toBeInTheDocument();
```

---

#### Scenario: Mint fails - moment inactive

**Given**:
- A moment has is_active = false

**When**:
- User attempts to mint

**Then**:
- Moment is NOT displayed in the list
- OR if displayed, mint button is disabled
- Transaction would fail with E_MOMENT_INACTIVE if attempted

**Verification**:
```typescript
// Inactive moments should not appear
const activeMoments = screen.getAllByTestId('moment-card');
activeMoments.forEach(card => {
  expect(card).not.toHaveTextContent('inactive-moment-id');
});
```

---

### Requirement: Real-time Supply Updates

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 3.2

The UI MUST reflect current supply after successful mints.

#### Scenario: Supply updates after mint

**Given**:
- Moment A displayed with "900 / 1000" remaining
- User successfully mints from Moment A

**When**:
- Mint transaction completes
- React Query cache is invalidated

**Then**:
- Moment list is refetched
- Moment A now shows "899 / 1000" remaining
- If supply reaches max, mint button becomes disabled

**Verification**:
```typescript
// Mock React Query mutation
const { mutate } = useMutation({
  mutationFn: mintNFT,
  onSuccess: () => {
    queryClient.invalidateQueries(['moments']);
  },
});

await mutate({ momentId, kioskId, kioskCapId });

// Check cache invalidation
expect(queryClient.getQueryState(['moments'])?.isInvalidated).toBe(true);
```

---

### Requirement: Mint Button States

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 3.2

Mint buttons MUST reflect moment availability and user state.

#### Scenario: Mint button state variations

**Given**:
- Various moments with different states

**When**:
- User views moment list

**Then**:
- Moment with remaining supply > 0 and active:
  - Button enabled, text "Mint"
- Moment with supply = max_supply:
  - Button disabled, text "売り切れ"
- User wallet not connected:
  - Button disabled, text "ウォレットを接続してください"
- Transaction in progress:
  - Button shows spinner, text "Minting..."

**Verification**:
```typescript
// Available moment
const availableButton = screen.getByTestId('mint-button-available');
expect(availableButton).toBeEnabled();
expect(availableButton).toHaveTextContent('Mint');

// Sold out moment
const soldOutButton = screen.getByTestId('mint-button-soldout');
expect(soldOutButton).toBeDisabled();
expect(soldOutButton).toHaveTextContent('売り切れ');

// Not connected
const noWalletButton = screen.getByTestId('mint-button-nowallet');
expect(noWalletButton).toBeDisabled();
```
