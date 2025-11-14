# object-display Specification

## Purpose
TBD - created by archiving change implement-fight-moments-nft. Update Purpose after archive.
## Requirements
### Requirement: Implement Display Template

**Priority**: HIGH  
**Source**: RQ-DISPLAY-01, RQ-DISPLAY-02

The system SHALL create a `Display<FightMomentNFT>` template using the Publisher capability, mapping NFT fields to standard display properties.

#### Scenario: Create Display template on initialization

**Given**:
- Contract is being initialized or upgraded
- A `Publisher` object exists (from `package::claim()`)

**When**:
- Admin calls `setup_display()` (or it's called automatically in init)

**Then**:
- A `Display<FightMomentNFT>` object is created
- Display template includes mappings for:
  - `name`: NFT title
  - `description`: NFT description
  - `image_url`: Thumbnail URI for static display
  - `video_url`: Video URI for video playback
  - `project_url`: Project website
  - `creator`: Creator info
- Display is updated and published
- Display object is shared or transferred to admin

**Verification**:
```bash
sui client object <display-id>
# Should show Display template with field mappings
```

---

#### Scenario: Display template uses NFT fields dynamically

**Given**:
- Display template is created with template syntax like `{field_name}`
- An NFT exists with:
  - match_id = "UFC300-001"
  - moment_type = "KO"
  - fighter_a = "Fighter A", fighter_b = "Fighter B"
  - thumbnail_uri = "walrus://thumb123"
  - video_uri = "walrus://vid456"

**When**:
- A wallet queries the NFT display

**Then**:
- The Display renders:
  - name = "Fight Moment UFC300-001 - KO" (using {match_id} and {moment_type})
  - description = "Fighter A vs Fighter B" (using {fighter_a} and {fighter_b})
  - image_url = "walrus://thumb123" (using {thumbnail_uri})
  - video_url = "walrus://vid456" (using {video_uri})

**Verification**:
- Query Display via RPC
- Verify fields populated from NFT data

---

### Requirement: Standard Field Mappings

**Priority**: HIGH  
**Source**: RQ-DISPLAY-02

The Display template SHALL include standard fields recommended by Sui Object Display specification.

#### Scenario: Display includes all standard fields

**Given**:
- Display template is created

**When**:
- Template is published

**Then**:
- The template includes (at minimum):
  - `name`: User-friendly title
  - `description`: Explanation of the NFT
  - `image_url`: Visual representation (thumbnail)
  - Optional but recommended:
    - `video_url`: Video content (for video NFTs)
    - `project_url`: Link to project site
    - `creator`: Creator attribution

**Verification**:
- Review Display object structure
- All standard fields present

---

### Requirement: Wallet and Explorer Compatibility

**Priority**: HIGH  
**Source**: RQ-DISPLAY-03

Object Display MUST be compatible with Sui wallets and explorers for automatic rendering.

#### Scenario: NFT displays in Sui Wallet

**Given**:
- An NFT with Display template exists
- User views NFT in Sui Wallet

**When**:
- Wallet queries NFT object

**Then**:
- Wallet uses Display template to render:
  - Thumbnail image from `image_url` (thumbnail_uri)
  - Title from `name`
  - Description from `description`
- User sees professional-looking NFT card

**Verification**:
- Open NFT in Sui Wallet
- Verify thumbnail, name, description shown correctly

---

#### Scenario: NFT displays in Sui Explorer

**Given**:
- An NFT with Display template exists
- User views NFT on Sui Explorer (e.g., explorer.sui.io)

**When**:
- Explorer queries NFT object

**Then**:
- Explorer renders NFT using Display template
- Shows image, name, description, video link
- Provides professional presentation

**Verification**:
- Visit explorer.sui.io, search for NFT ID
- Verify display matches template

---

