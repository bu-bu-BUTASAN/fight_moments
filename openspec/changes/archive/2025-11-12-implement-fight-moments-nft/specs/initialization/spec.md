# Specification: Contract Initialization

**Capability**: `initialization`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Contract initialization establishes administrative control and sets up required infrastructure for the Fight Moments NFT system. This includes creating the AdminCap for privileged operations, establishing the TransferPolicy for future royalty enforcement, and preparing the Publisher for Object Display.

---

## ADDED Requirements

### Requirement: Create AdminCap on Initialization

**Priority**: CRITICAL  
**Source**: RQ-INIT-01, RQ-INIT-02

The contract MUST create exactly one `AdminCap` during initialization and transfer it to the deployer address. This capability controls all administrative functions.

#### Scenario: Deploy contract and receive AdminCap

**Given**:
- A deployer account with sufficient SUI for gas
- The contract has not been deployed yet

**When**:
- The deployer executes `sui client publish` on the contract

**Then**:
- An `AdminCap` object is created
- The `AdminCap` is transferred to the deployer's address
- The deployer can use this `AdminCap` for admin functions
- No other `AdminCap` exists in the system

**Verification**:
```bash
sui client objects --owned-by <deployer-address>
# Should show AdminCap object
```

---

#### Scenario: Non-admin cannot execute admin functions

**Given**:
- The contract is deployed
- An `AdminCap` exists, owned by admin address A
- A user address B does not own an `AdminCap`

**When**:
- User B attempts to call `register_moment()` (admin-only function)

**Then**:
- The transaction fails with an error indicating missing `AdminCap`
- No moment is registered
- The contract state remains unchanged

**Verification**:
- Transaction aborted with error code or message

---

### Requirement: Create TransferPolicy for NFTs

**Priority**: CRITICAL  
**Source**: RQ-INIT-04, RQ-INIT-05

The contract MUST create a `TransferPolicy<FightMomentNFT>` during initialization and publish it as a shared object. The corresponding `TransferPolicyCap` MUST be retained for future policy updates.

#### Scenario: TransferPolicy created and shared

**Given**:
- The contract is being initialized

**When**:
- The `init()` function executes

**Then**:
- A `TransferPolicy<FightMomentNFT>` object is created
- The TransferPolicy is shared (publicly accessible)
- A `TransferPolicyCap` is created
- The TransferPolicyCap is transferred to the deployer (for future rule management)
- The TransferPolicy initially has no rules (free transfers allowed)

**Verification**:
```bash
sui client object <transfer-policy-id>
# Should show shared object status
```

---

#### Scenario: Kiosk operations use TransferPolicy

**Given**:
- TransferPolicy exists as shared object
- A user mints an NFT and locks it in their Kiosk

**When**:
- The user calls `kiosk::lock()` to lock the NFT

**Then**:
- The operation references the TransferPolicy
- The NFT is successfully locked in the Kiosk
- Future transfer attempts will be subject to TransferPolicy rules (when activated)

**Verification**:
- Kiosk shows locked NFT
- NFT cannot be withdrawn directly

---

### Requirement: Create Publisher for Object Display

**Priority**: HIGH  
**Source**: RQ-DISPLAY-01

The contract SHALL create a `Publisher` object during initialization to enable Object Display template creation.

#### Scenario: Publisher created for display setup

**Given**:
- The contract is being initialized

**When**:
- The `init()` function executes

**Then**:
- A `Publisher` object is created using `package::claim()`
- The Publisher is transferred to the deployer
- The Publisher can be used later to create `Display<FightMomentNFT>` templates

**Verification**:
```bash
sui client objects --owned-by <deployer-address>
# Should show Publisher object
```

---

### Requirement: Currency Fixed to SUI

**Priority**: CRITICAL  
**Source**: RQ-INIT-06, NFR-07

The system MUST use SUI as the only currency for all transactions. No multi-currency support is required in the initial implementation.

#### Scenario: Kiosk listings use SUI only

**Given**:
- A user has an NFT locked in their Kiosk
- The user wants to list the NFT for sale

**When**:
- The user calls `kiosk::list()` with a price

**Then**:
- The price is denominated in SUI
- The listing only accepts SUI for purchase
- No other coin types are supported

**Verification**:
- Kiosk listing shows SUI price
- Purchase requires SUI payment

---

### Requirement: Future Admin Rotation Support

**Priority**: LOW  
**Source**: RQ-INIT-03

The contract SHALL support future transfer of AdminCap to enable admin rotation or multi-sig control.

#### Scenario: AdminCap is transferable

**Given**:
- An `AdminCap` exists, owned by address A

**When**:
- Address A executes a transfer of `AdminCap` to address B

**Then**:
- The `AdminCap` is now owned by address B
- Address B can execute admin functions
- Address A can no longer execute admin functions

**Verification**:
```bash
# After transfer
sui client objects --owned-by <address-B>
# Should show AdminCap
```

**Note**: Transfer mechanism uses standard Sui `transfer::public_transfer()` or similar, no custom logic required.

---

## Test Coverage

### Unit Tests Required

1. **test_init_creates_admin_cap**
   - Verify AdminCap created and transferred to deployer

2. **test_init_creates_transfer_policy**
   - Verify TransferPolicy<FightMomentNFT> created as shared object
   - Verify TransferPolicyCap transferred to deployer

3. **test_init_creates_publisher**
   - Verify Publisher created and transferred to deployer

4. **test_non_admin_cannot_call_admin_functions**
   - Verify admin functions reject calls without AdminCap

5. **test_admin_cap_transferable**
   - Verify AdminCap can be transferred to new owner
   - Verify new owner can execute admin functions

---

## Dependencies

### External
- `sui::transfer` - For transferring capabilities
- `sui::transfer_policy` - For creating TransferPolicy
- `sui::package` - For claiming Publisher

### Internal
- `AdminCap` struct definition
- `FightMomentNFT` struct definition (for TransferPolicy type parameter)

---

## Error Codes

- `E_NOT_ADMIN`: Caller does not own AdminCap (abort code: 1)
- `E_INVALID_ADMIN_CAP`: AdminCap is invalid or not from this package (abort code: 2)

---

## Migration Notes

- **From Empty Contract**: Direct deployment, no migration needed
- **AdminCap Rotation**: Use standard transfer, no contract upgrade required
- **TransferPolicy Updates**: Use TransferPolicyCap to add rules post-deployment
