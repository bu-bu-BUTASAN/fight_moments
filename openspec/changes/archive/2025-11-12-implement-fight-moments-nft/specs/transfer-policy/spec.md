# Specification: Transfer Policy & Royalties

**Capability**: `transfer-policy`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Transfer Policy management provides a future-ready structure for royalty distribution across three parties: Fighter A, Fighter B, and the organizing entity. While royalty enforcement is NOT required for the initial MVP, the data structures and admin functions are included to demonstrate the full vision and enable easy activation post-hackathon.

---

## ADDED Requirements

### Requirement: Royalty Configuration Structure

**Priority**: MEDIUM (Future Enhancement)  
**Source**: RQ-ROYALTY-01, RQ-ROYALTY-02, RQ-ROYALTY-03

The system SHALL provide a structure to configure three-party royalty distribution with basis points (BPS) per party.

#### Scenario: Admin sets royalty configuration

**Given**:
- Admin owns `AdminCap` and `TransferPolicyCap`
- Three parties identified:
  - Fighter A: 0xFighterA (500 BPS = 5%)
  - Fighter B: 0xFighterB (500 BPS = 5%)
  - Organization: 0xOrg (200 BPS = 2%)

**When**:
- Admin calls `set_royalty_config()`
- Provides addresses and BPS for each party

**Then**:
- A `RoyaltyConfig` is stored in TransferPolicy metadata
- Total BPS = 1200 (12%) is within allowed limit
- Configuration is retrievable via getter

**Verification**:
```bash
sui client call --function get_royalty_config
# Should return config with 3 parties and BPS
```

---

#### Scenario: Royalty BPS validation

**Given**:
- Admin attempts to set royalty config
- Total BPS exceeds limit (e.g., 2500 BPS = 25%)

**When**:
- Admin calls `set_royalty_config()` with excessive BPS

**Then**:
- The transaction fails with error `E_ROYALTY_BPS_TOO_HIGH`
- No config is stored
- Maximum BPS limit enforced (e.g., 2000 BPS = 20%)

**Verification**:
- Transaction aborted
- Config unchanged

---

#### Scenario: Royalty address validation

**Given**:
- Admin sets royalty config
- One party has BPS > 0 but address = 0x0 (zero address)

**When**:
- Admin calls `set_royalty_config()`

**Then**:
- The transaction fails with error `E_INVALID_ROYALTY_ADDRESS`
- If BPS > 0, address MUST be non-zero

**Verification**:
- Transaction aborted

---

### Requirement: Royalty Enforcement Framework

**Priority**: MEDIUM  
**Source**: RQ-ROYALTY-04, RQ-ROYALTY-05

The system SHALL provide the structure for future royalty enforcement, but enforcement MUST NOT be active in the initial implementation.

#### Scenario: Royalty config can be set without enforcement

**Given**:
- Royalty config is set in TransferPolicy
- An NFT is listed and purchased in Kiosk

**When**:
- Buyer purchases NFT for 100 SUI

**Then**:
- Buyer pays 100 SUI
- Seller receives 100 SUI (no royalty deduction)
- Royalty config exists but enforcement is disabled
- Future activation possible without contract changes

**Verification**:
- Seller receives full amount
- No automatic distribution to fighters/org
- Config structure is in place for future use

**Note**: Enforcement activation is a post-MVP enhancement.

---

### Requirement: Admin-Only Royalty Management

**Priority**: MEDIUM  
**Source**: RQ-ROYALTY-02

Only admin (holding AdminCap) MUST be able to modify royalty configuration.

#### Scenario: Admin updates royalty config

**Given**:
- Admin owns AdminCap
- Existing royalty config in place

**When**:
- Admin calls `set_royalty_config()` with new values

**Then**:
- The config is updated
- Old config is replaced

**Verification**:
- New config retrievable via getter

---

#### Scenario: Non-admin cannot update royalty config

**Given**:
- A user does NOT own AdminCap
- User attempts to modify royalty config

**When**:
- User calls `set_royalty_config()`

**Then**:
- Transaction fails with error `E_NOT_ADMIN`
- Config unchanged

**Verification**:
- Transaction aborted

---

## Test Coverage

### Unit Tests Required

1. **test_set_royalty_config_success**
   - Admin sets valid royalty config
   - Verify config stored correctly

2. **test_set_royalty_config_validates_bps_limit**
   - Attempt to set total BPS > 2000
   - Verify transaction fails with E_ROYALTY_BPS_TOO_HIGH

3. **test_set_royalty_config_validates_addresses**
   - Set BPS > 0 with zero address
   - Verify transaction fails with E_INVALID_ROYALTY_ADDRESS

4. **test_set_royalty_config_requires_admin**
   - Non-admin attempts to set config
   - Verify transaction fails with E_NOT_ADMIN

5. **test_get_royalty_config**
   - Set config, then retrieve
   - Verify returned values match

6. **test_royalty_not_enforced_in_mvp**
   - Purchase NFT with royalty config set
   - Verify seller receives full payment (no deduction)

---

## Dependencies

### External
- `sui::transfer_policy::TransferPolicy` - Policy object
- `sui::transfer_policy::TransferPolicyCap` - For updates

### Internal
- `AdminCap` (from initialization)
- `FightMomentNFT` (for TransferPolicy type parameter)

---

## Error Codes

- `E_NOT_ADMIN`: Caller does not own AdminCap (abort code: 1)
- `E_ROYALTY_BPS_TOO_HIGH`: Total BPS exceeds limit (abort code: 30)
- `E_INVALID_ROYALTY_ADDRESS`: BPS > 0 but address is zero (abort code: 31)

---

## Data Structures

### RoyaltyConfig
```move
struct RoyaltyConfig has store, copy, drop {
    fighter_a_address: Option<address>,
    fighter_a_bps: u16,
    fighter_b_address: Option<address>,
    fighter_b_bps: u16,
    org_address: Option<address>,
    org_bps: u16,
}
```

**Constants**:
```move
const MAX_ROYALTY_BPS: u16 = 2000; // 20%
```

---

## Future Activation Plan

### Phase 1: MVP (Current)
- ✅ Data structures defined
- ✅ Admin functions for config management
- ❌ NO enforcement in purchases

### Phase 2: Post-Hackathon
- Add royalty rule to TransferPolicy
- Implement automatic split logic in purchase flow
- Test with real transactions
- Audit security of distribution logic

### Phase 3: Production
- Deploy to mainnet with enforcement active
- Monitor royalty distributions
- Provide dashboard for fighters/org to track earnings
