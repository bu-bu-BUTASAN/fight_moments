# Specification: Object Display

**Capability**: `object-display`  
**Change ID**: `implement-fight-moments-nft`

## Overview

Sui Object Display provides a standardized way for wallets, explorers, and marketplaces to display NFTs without custom integration. By implementing a Display template, Fight Moment NFTs will automatically render correctly in any Sui-compatible interface.

---

## ADDED Requirements

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

## Test Coverage

### Unit Tests Required

1. **test_setup_display**
   - Call `setup_display()` with Publisher
   - Verify Display<FightMomentNFT> created

2. **test_display_field_mappings**
   - Verify Display template includes:
     - name, description, image_url, video_url
   - Verify template syntax uses {field_name}

3. **test_display_uses_nft_fields**
   - Mint NFT with specific values
   - Query Display rendering
   - Verify fields populated from NFT data

4. **test_display_thumbnail_for_image**
   - Verify `image_url` maps to `thumbnail_uri` (not video_uri)
   - Ensures wallets show static image first

5. **test_display_video_for_animation**
   - Verify `video_url` maps to `video_uri`
   - Ensures video players can access video

---

## Dependencies

### External
- `sui::display` - Display template creation
- `sui::package::Publisher` - Required for Display creation

### Internal
- `FightMomentNFT` struct
- `Publisher` object (from initialization)

---

## Error Codes

- (No specific errors - Display creation is admin-only, failures are rare)

---

## Template Example

```move
use sui::display;

public fun setup_display(
    publisher: &Publisher,
    ctx: &mut TxContext
) {
    let mut display = display::new<FightMomentNFT>(publisher, ctx);
    
    display.add(b"name", b"Fight Moment #{match_id} - {moment_type}");
    display.add(b"description", b"{fighter_a} vs {fighter_b} - Decisive moment from match {match_id}");
    display.add(b"image_url", b"{thumbnail_uri}");
    display.add(b"video_url", b"{video_uri}");
    display.add(b"project_url", b"https://fightmoments.xyz");
    display.add(b"creator", b"Fight Moments Official");
    
    display.update_version();
    transfer::public_transfer(display, tx_context::sender(ctx));
}
```

**Field Mapping**:
- `#{match_id}` → Replaced with NFT's match_id value
- `{moment_type}` → Replaced with NFT's moment_type value
- `{fighter_a}`, `{fighter_b}` → Replaced with fighter names
- `{thumbnail_uri}`, `{video_uri}` → Replaced with Walrus URIs

---

## Integration Notes

### Frontend Rendering
Most Sui wallets automatically use Object Display, so no frontend work needed. However:

**Custom Display** (if needed):
```typescript
// Get Display data for NFT
const display = await client.getObjectDisplay(nftId);

// Display fields available:
console.log(display.data.name);        // "Fight Moment UFC300-001 - KO"
console.log(display.data.image_url);   // "walrus://thumb123"
console.log(display.data.video_url);   // "walrus://vid456"
```

### Best Practices
1. **Use thumbnail for image_url**: Fast loading, works in wallets that don't support video
2. **Use video for video_url**: Video players can opt to show this
3. **Keep name concise**: Wallets may truncate long names
4. **Include project_url**: Builds trust and brand awareness

---

## Future Enhancements

### Dynamic Display Updates
- Update Display template to include:
  - Serial number in name: "Fight Moment #123/1000"
  - Rarity tier: "Rare KO Moment"
  - Match date: "UFC 300 - April 2024"

### Localization
- Create multiple Display templates for different languages
- Switch based on user locale (future Sui feature)
