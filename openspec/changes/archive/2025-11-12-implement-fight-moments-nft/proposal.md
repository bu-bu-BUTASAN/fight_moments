# Proposal: Implement Fight Moments NFT Contract

**Change ID**: `implement-fight-moments-nft`  
**Status**: Proposed  
**Created**: 2025-11-12

## Overview

This proposal implements a Sui Move smart contract for the Fight Moments NFT system, which allows minting and trading NFTs representing decisive moments in martial arts matches. The system integrates with Sui Kiosk for marketplace functionality and Walrus for media storage.

## Problem Statement

Currently, there is no on-chain infrastructure to:
- Record and preserve decisive moments from fighting matches as NFTs
- Enable official organizations to control which moments can be minted
- Allow users to mint, own, and trade these moment NFTs
- Integrate with Walrus for efficient media storage (videos and thumbnails)
- Provide a marketplace using Sui Kiosk for trading NFTs
- Support future royalty distribution to fighters and organizers

## Proposed Solution

Implement a comprehensive Sui Move contract system with the following core capabilities:

### 1. **Initialization & Access Control**
- Single `AdminCap` for administrative operations
- `TransferPolicy` for future royalty enforcement
- SUI-only currency support (no multi-currency complexity)

### 2. **Moment Registration** (Admin-only)
- Define "mintable moments" with match metadata
- Specify max supply per moment
- Store Walrus URIs for video and thumbnail
- Emit events for off-chain synchronization

### 3. **User Minting**
- Users mint NFTs from registered moments
- Automatic Kiosk integration (NFTs locked in Kiosk on mint)
- Supply tracking and limit enforcement
- First-time minters get a Kiosk created automatically

### 4. **Kiosk Integration**
- NFTs are locked in Kiosk (cannot be directly withdrawn)
- Support for listing NFTs with SUI-based pricing
- Marketplace-friendly metadata (collection_id, match_id, etc.)

### 5. **Walrus Media References**
- Store video URI and thumbnail URI separately
- Support for Suiet's dual-display pattern (animation_url → url)
- Hash/Blob ID for verification
- No on-chain media validation (handled by frontend/relay)

### 6. **Transfer Policy** (Future-ready)
- Support for 3-party royalty distribution (Fighter A, Fighter B, Organization)
- Configurable BPS (basis points) per party
- Admin-only configuration
- **NOT enforced in initial implementation** (hackathon scope)

### 7. **Public Getters**
- Read moment metadata
- Check remaining mint supply
- Access Walrus URIs
- Get collection/match identifiers for marketplace display

### 8. **Object Display** (Recommended)
- Sui Object Display template for standard wallet/explorer compatibility
- Display name, description, image_url (thumbnail), video_url

### 9. **Event System**
- Moment creation events
- Mint events
- Optional Kiosk listing events

## Scope

### In Scope
- All contract functionality described above
- Move package configuration (`Move.toml` dependencies)
- Unit tests for core functions
- Documentation for contract deployment

### Out of Scope
- Frontend implementation (separate work item)
- Actual Walrus upload logic (handled by frontend)
- Automatic royalty distribution enforcement (future enhancement)
- Multi-currency support (SUI-only for hackathon)

## Dependencies

### External Dependencies
- Sui Framework (standard library)
- Sui Kiosk package
- Sui Transfer Policy package
- Sui Object Display standard

### Internal Dependencies
- None (greenfield implementation)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Kiosk API changes | High | Use stable Kiosk APIs, version lock dependencies |
| Complex TransferPolicy setup | Medium | Keep initial implementation simple, defer enforcement |
| Walrus URI validation | Low | Validate format only, rely on frontend for content verification |
| Gas costs for users | Medium | Optimize transaction structure, batch operations in PTB |

## Success Criteria

1. ✅ Admin can register mintable moments with Walrus URIs
2. ✅ Users can mint NFTs from available moments
3. ✅ NFTs automatically locked in user's Kiosk on mint
4. ✅ Users can list NFTs in Kiosk with SUI pricing
5. ✅ Marketplace can query and display listed NFTs
6. ✅ Object Display works in Sui wallets/explorers
7. ✅ All core functions covered by unit tests
8. ✅ Transfer Policy structure ready for future royalty enforcement

## Related Documents

- [Contract Design Requirements](../../../docs/contract-design.md)
- [Frontend Design Requirements](../../../docs/frontend-design.md)
- [Project README](../../../README.md)
