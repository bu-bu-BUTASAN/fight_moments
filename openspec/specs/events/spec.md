# events Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
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

