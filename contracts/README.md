# Fight Moments NFT Contract

A Sui Move smart contract for minting and trading NFTs representing decisive moments from martial arts matches.

## Features

- **Admin-controlled Moment Registration**: Only authorized admins can create new mintable moments
- **User Minting**: Users can mint NFTs from approved moments
- **Kiosk Integration**: NFTs are automatically locked in Sui Kiosk for marketplace functionality
- **Walrus Media Storage**: Video and thumbnail URIs stored on Walrus for efficient media handling
- **Transfer Policy**: Future-ready for royalty distribution to fighters and organizers
- **Object Display**: Wallet and explorer compatible NFT metadata display

## Architecture

### Core Components

1. **AdminCap**: Administrative capability for privileged operations
2. **MintableMoment**: Shared object representing a moment that can be minted
3. **FightMomentNFT**: The actual NFT owned by users (locked in Kiosk)
4. **TransferPolicy**: For future royalty enforcement
5. **Object Display**: Standard display template for wallets/explorers

### Data Flow

```
Admin → Register Moment → Share MintableMoment
User → Mint NFT → Lock in Kiosk → List for Sale
Buyer → Purchase from Kiosk → NFT Transfer
```

## Building

```bash
cd contracts
sui move build
```

## Testing

Run all unit tests:

```bash
sui move test
```

Test with verbose output:

```bash
sui move test -- --verbose
```

## Deployment

### Testnet

```bash
sui client publish --gas-budget 100000000
```

Save the package ID and update your frontend configuration.

### After Deployment

1. Save the `AdminCap` object ID (transferred to deployer)
2. Save the `TransferPolicy` object ID (shared object)
3. Save the `Package ID` for frontend integration

## Contract Functions

### Admin Functions

#### `register_moment`
Register a new mintable moment.

**Parameters**:
- `admin_cap`: Reference to AdminCap
- `match_id`: Unique match identifier
- `fighter_a`: First fighter name
- `fighter_b`: Second fighter name
- `moment_type`: Type ("KO", "SUBMISSION", "DECISION", "HIGHLIGHT")
- `video_uri`: Walrus video URI
- `thumbnail_uri`: Walrus thumbnail URI
- `blob_id`: Walrus blob identifier
- `content_hash`: Content hash for verification
- `max_supply`: Maximum mintable NFTs

**Example**:
```move
fight_moments::register_moment(
    &admin_cap,
    string::utf8(b"MATCH001"),
    string::utf8(b"Conor McGregor"),
    string::utf8(b"Dustin Poirier"),
    string::utf8(b"KO"),
    string::utf8(b"walrus://abc123/video.mp4"),
    string::utf8(b"walrus://abc123/thumb.jpg"),
    string::utf8(b"blob_id_123"),
    string::utf8(b"content_hash_123"),
    1000,
    ctx
);
```

#### `deactivate_moment`
Prevent new mints from a moment.

#### `reactivate_moment`
Allow minting again from a previously deactivated moment.

### User Functions

#### `create_kiosk_and_mint`
Create a new Kiosk and mint an NFT (for first-time users).

**Parameters**:
- `moment`: Mutable reference to MintableMoment
- `policy`: Reference to TransferPolicy
- `clock`: Reference to Clock
- `ctx`: Transaction context

**Example**:
```move
fight_moments::create_kiosk_and_mint(
    &mut moment,
    &policy,
    &clock,
    ctx
);
```

#### `mint_and_lock`
Mint an NFT into an existing Kiosk.

**Parameters**:
- `moment`: Mutable reference to MintableMoment
- `kiosk`: Mutable reference to Kiosk
- `kiosk_cap`: Reference to KioskOwnerCap
- `policy`: Reference to TransferPolicy
- `clock`: Reference to Clock
- `ctx`: Transaction context

### Public Getters

#### `get_moment_metadata`
Get all metadata for a moment.

#### `get_remaining_supply`
Get remaining mintable NFTs for a moment.

#### `get_nft_metadata`
Get all metadata for an NFT.

#### `get_collection_id`
Get the collection identifier from an NFT.

## Events

### MomentRegistered
Emitted when a new moment is registered.

**Fields**:
- `moment_id`: ID of the moment
- `match_id`: Match identifier
- `moment_type`: Type of moment
- `max_supply`: Maximum supply
- `creator`: Admin who registered

### NFTMinted
Emitted when an NFT is minted.

**Fields**:
- `nft_id`: ID of the NFT
- `moment_id`: ID of the moment
- `minter`: Address that minted
- `timestamp`: Mint timestamp
- `serial_number`: Serial number within moment

### MomentDeactivated / MomentReactivated
Emitted when moments are activated/deactivated.

## Error Codes

- `ENotAuthorized (0)`: Unauthorized access
- `EInvalidMoment (1)`: Invalid moment reference
- `EMomentInactive (2)`: Moment is not active for minting
- `ESupplyExhausted (3)`: No more NFTs available to mint
- `EInvalidInput (4)`: Invalid input parameters
- `EInvalidURI (5)`: Invalid Walrus URI format
- `ERoyaltyTooHigh (6)`: Royalty percentage exceeds maximum

## Frontend Integration

### Reading Moments

```typescript
// Get all shared MintableMoment objects
const moments = await client.getOwnedObjects({
  filter: {
    StructType: `${PACKAGE_ID}::fight_moments::MintableMoment`
  }
});

// Read moment metadata
const moment = await client.getObject({
  id: momentId,
  options: { showContent: true }
});
```

### Minting NFT

```typescript
const tx = new TransactionBlock();

tx.moveCall({
  target: `${PACKAGE_ID}::fight_moments::create_kiosk_and_mint`,
  arguments: [
    tx.object(momentId),
    tx.object(transferPolicyId),
    tx.object('0x6') // Clock
  ]
});

await client.signAndExecuteTransactionBlock({ transactionBlock: tx });
```

### Listing NFT in Kiosk

```typescript
const tx = new TransactionBlock();

tx.moveCall({
  target: '0x2::kiosk::list',
  typeArguments: [`${PACKAGE_ID}::fight_moments::FightMomentNFT`],
  arguments: [
    tx.object(kioskId),
    tx.object(kioskCapId),
    tx.pure(nftId),
    tx.pure(priceInSUI)
  ]
});

await client.signAndExecuteTransactionBlock({ transactionBlock: tx });
```

## Future Enhancements

### Phase 6: Royalty Implementation (Post-Hackathon)

Currently, the contract includes royalty configuration structs but does not enforce royalties on transfers. Future implementation will:

1. Activate Transfer Policy rules
2. Implement automatic 3-party royalty splits:
   - Fighter A
   - Fighter B
   - Organization
3. Enforce royalties on Kiosk purchases
4. Support configurable basis points (BPS) per party

### Other Potential Features

- Batch minting for airdrops
- Moment bundles (multi-NFT packs)
- Rarity tiers
- Time-limited minting windows
- Cross-chain bridges

## Security Considerations

- AdminCap required for all privileged operations
- Supply limits enforced atomically during mint
- NFTs locked in Kiosk prevent accidental transfers
- Input validation on all external functions
- Events for off-chain monitoring

## License

This project is part of the Fight Moments platform built during the Sui Hackathon.

## Support

For issues or questions:
1. Check the contract tests in `tests/fight_moments_tests.move`
2. Review the design document in `/openspec/changes/implement-fight-moments-nft/design.md`
3. Create an issue in the project repository
