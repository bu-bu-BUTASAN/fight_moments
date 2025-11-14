# Specification: Event System

**Capability**: `events`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Events provide a mechanism for off-chain systems (frontends, indexers, analytics) to react to on-chain state changes in real-time. By emitting structured events for key operations, the Fight Moments system enables efficient synchronization and monitoring.

---

## ADDED Requirements

### Requirement: Moment Registration Events

**Priority**: HIGH  
**Source**: RQ-EVENT-01, RQ-EVENT-03

The system MUST emit a `MomentRegistered` event when an admin creates a new mintable moment.

#### Scenario: Event emitted on moment registration

**Given**:
- Admin registers a new moment

**When**:
- `register_moment()` completes successfully

**Then**:
- A `MomentRegistered` event is emitted with:
  - `moment_id`: ID of the created moment
  - `match_id`: Match identifier
  - `moment_type`: Type of moment (KO, SUBMISSION, etc.)
  - `max_supply`: Maximum mintable supply
  - `timestamp`: Registration time

**Verification**:
```bash
sui client events --module fight_moments --sender <admin-address>
# Should show MomentRegistered event
```

---

### Requirement: NFT Minting Events

**Priority**: HIGH  
**Source**: RQ-EVENT-01, RQ-EVENT-03

The system MUST emit an `NFTMinted` event when a user mints an NFT.

#### Scenario: Event emitted on successful mint

**Given**:
- User mints an NFT from a moment

**When**:
- `mint_and_lock()` completes successfully

**Then**:
- An `NFTMinted` event is emitted with:
  - `nft_id`: ID of the created NFT
  - `moment_id`: Source moment ID
  - `minter`: User's address
  - `timestamp`: Mint time
  - `serial_number`: NFT's serial number

**Verification**:
```bash
sui client events --module fight_moments
# Should show NFTMinted event with correct data
```

---

### Requirement: Moment Activation Events

**Priority**: MEDIUM  
**Source**: Implied by moment management requirements

The system SHALL emit events when moments are activated or deactivated.

#### Scenario: Event emitted on moment deactivation

**Given**:
- Admin deactivates a moment

**When**:
- `deactivate_moment()` completes

**Then**:
- A `MomentDeactivated` event is emitted with:
  - `moment_id`: ID of deactivated moment
  - `timestamp`: Deactivation time

**Verification**:
```bash
sui client events --module fight_moments
# Should show MomentDeactivated event
```

---

#### Scenario: Event emitted on moment reactivation

**Given**:
- Admin reactivates a moment

**When**:
- `reactivate_moment()` completes

**Then**:
- A `MomentReactivated` event is emitted with:
  - `moment_id`: ID of reactivated moment
  - `timestamp`: Reactivation time

**Verification**:
- Event emitted and indexed

---

### Requirement: Event Schema Documentation

**Priority**: HIGH  
**Source**: RQ-EVENT-03

All event schemas MUST be documented for off-chain consumers (frontends, indexers).

#### Scenario: Event schemas are documented

**Given**:
- Multiple event types exist

**When**:
- Frontend developer wants to subscribe to events

**Then**:
- Documentation provides:
  - Event names
  - Field names and types
  - Example event payloads
  - When each event is emitted

**Verification**:
- Documentation file exists (e.g., EVENTS.md)
- All events listed with schemas

---

## Test Coverage

### Unit Tests Required

1. **test_moment_registered_event**
   - Register moment
   - Verify MomentRegistered event emitted
   - Verify event contains correct data

2. **test_nft_minted_event**
   - Mint NFT
   - Verify NFTMinted event emitted
   - Verify event contains nft_id, moment_id, minter, serial_number

3. **test_moment_deactivated_event**
   - Deactivate moment
   - Verify MomentDeactivated event emitted

4. **test_moment_reactivated_event**
   - Reactivate moment
   - Verify MomentReactivated event emitted

5. **test_event_fields_populated**
   - For each event type, verify all fields contain expected values

---

## Dependencies

### External
- `sui::event` - Event emission

### Internal
- All major operations (register, mint, activate, deactivate)

---

## Event Schemas

### MomentRegistered
```move
struct MomentRegistered has copy, drop {
    moment_id: ID,
    match_id: String,
    moment_type: String,
    max_supply: u64,
    timestamp: u64,
}
```

**Emitted**: When admin successfully registers a new moment

---

### NFTMinted
```move
struct NFTMinted has copy, drop {
    nft_id: ID,
    moment_id: ID,
    minter: address,
    timestamp: u64,
    serial_number: u64,
}
```

**Emitted**: When user successfully mints an NFT

---

### MomentDeactivated
```move
struct MomentDeactivated has copy, drop {
    moment_id: ID,
    timestamp: u64,
}
```

**Emitted**: When admin deactivates a moment

---

### MomentReactivated
```move
struct MomentReactivated has copy, drop {
    moment_id: ID,
    timestamp: u64,
}
```

**Emitted**: When admin reactivates a moment

---

### NFTListed (Future/Optional)
```move
struct NFTListed has copy, drop {
    nft_id: ID,
    kiosk_id: ID,
    price: u64,
    seller: address,
    timestamp: u64,
}
```

**Emitted**: When NFT is listed in Kiosk (requires custom wrapper)

---

## Integration Notes

### Frontend Event Subscription

**Using Sui SDK**:
```typescript
import { SuiClient } from '@mysten/sui.js';

const client = new SuiClient({ url: RPC_URL });

// Subscribe to NFTMinted events
const unsubscribe = await client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::fight_moments::NFTMinted`
  },
  onMessage: (event) => {
    console.log('NFT Minted:', event.parsedJson);
    // Update UI, refresh NFT list, etc.
  }
});
```

**Indexer Pattern**:
```typescript
// Poll for recent events (if subscription not available)
async function pollEvents() {
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${PACKAGE_ID}::fight_moments::MomentRegistered`
    },
    order: 'descending',
    limit: 50
  });
  
  // Process new moments
  for (const event of events.data) {
    const { moment_id, match_id, moment_type } = event.parsedJson;
    // Update database or UI
  }
}
```

### Analytics Use Cases
- **Supply Tracking**: Monitor NFTMinted events to track mint velocity
- **Moment Popularity**: Count mints per moment to identify popular matches
- **User Activity**: Track minter addresses for community building
- **Marketplace Activity**: Monitor listing events for marketplace analytics

---

## Best Practices

1. **Keep Event Payloads Small**: Only include essential data
2. **Use IDs for References**: Don't embed entire objects, use IDs and let consumers query details
3. **Include Timestamps**: Enables time-based filtering and sorting
4. **Document Event Schemas**: Maintain clear documentation for consumers
5. **Version Events Carefully**: Changing event structure breaks indexers

---

## Future Enhancements

### Kiosk Listing Events (Optional)
- Emit `NFTListed` events when NFTs are listed in Kiosks
- Emit `NFTDelisted` events when listings are removed
- Requires custom wrapper around `kiosk::list()` and `kiosk::delist()`
- Enables real-time marketplace UI updates

### Enhanced Event Data
- Add `creator` field to MomentRegistered
- Add `rarity_tier` to NFTMinted
- Add `previous_price` to NFTListed (for price change tracking)

### Event-Driven Notifications
- Build notification service that subscribes to events
- Send push notifications to users when:
  - New moments are registered
  - NFTs are sold
  - Rare moments become available
