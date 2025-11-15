# admin-upload-workflow Specification

## ADDED Requirements

### Requirement: Admin Video Upload to Walrus

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.1, 4

Admin MUST be able to upload video and thumbnail files to Walrus via Upload Relay and obtain URIs to register moments on Sui.

#### Scenario: Successful video and thumbnail upload

**Given**:
- Admin has selected a valid video file (MP4, <= 30 seconds)
- Admin has selected a valid thumbnail file (JPG/PNG)
- Walrus Upload Relay is available at `${NEXT_PUBLIC_WALRUS_RELAY_URL}`

**When**:
- Admin clicks "Upload" button
- Frontend validates video duration (must be <= 30 seconds)
- Frontend uploads video file to Walrus Upload Relay
- Frontend uploads thumbnail file to Walrus Upload Relay

**Then**:
- Video upload succeeds and returns `{ uri: "walrus://vid...", blobId: "...", hash: "..." }`
- Thumbnail upload succeeds and returns `{ uri: "walrus://thumb...", blobId: "...", hash: "..." }`
- Both URIs and hash are stored in form state
- UI displays "Upload successful" message
- Registration form becomes enabled with pre-filled URIs

**Verification**:
```typescript
// Check upload result structure
expect(videoResult).toHaveProperty('uri');
expect(videoResult).toHaveProperty('blobId');
expect(videoResult).toHaveProperty('hash');
expect(videoResult.uri).toMatch(/^walrus:\/\//);

expect(thumbnailResult).toHaveProperty('uri');
expect(thumbnailResult.uri).toMatch(/^walrus:\/\//);
```

---

#### Scenario: Video duration validation failure

**Given**:
- Admin has selected a video file with duration > 30 seconds

**When**:
- Admin attempts to upload
- Frontend checks video duration using browser's video element

**Then**:
- Upload is prevented before Walrus upload
- Error message displayed: "動画の長さは30秒以内である必要があります"
- Form remains in editable state
- Walrus upload is NOT initiated

**Verification**:
```typescript
// Simulate long video
const longVideo = new File([], 'long.mp4', { type: 'video/mp4' });
Object.defineProperty(longVideo, 'duration', { value: 35 });

await expect(uploadToWalrus(longVideo)).rejects.toThrow(
  '動画の長さは30秒以内である必要があります'
);
```

---

#### Scenario: Upload progress display

**Given**:
- Admin has selected valid files
- Upload is in progress

**When**:
- Walrus SDK is uploading files

**Then**:
- UI displays "動画アップロード中..." during video upload
- UI displays "サムネイルアップロード中..." during thumbnail upload
- Progress percentage is shown (if available from SDK)
- Upload can be cancelled by user

**Verification**:
```typescript
// Check progress UI elements
expect(screen.getByText('動画アップロード中...')).toBeInTheDocument();
expect(screen.getByText('サムネイルアップロード中...')).toBeInTheDocument();
```

---

#### Scenario: Upload retry on failure

**Given**:
- Walrus Upload Relay is temporarily unavailable
- Admin has selected valid files

**When**:
- Upload fails with network error
- Frontend automatically retries (up to 3 times)

**Then**:
- First attempt fails
- Second attempt is made after 1 second delay
- If all retries fail, error message is displayed
- User can manually retry upload

**Verification**:
```typescript
// Mock Walrus SDK to fail first 2 times
const uploadSpy = vi.spyOn(walrusClient, 'upload')
  .mockRejectedValueOnce(new Error('Network error'))
  .mockRejectedValueOnce(new Error('Network error'))
  .mockResolvedValueOnce({ uri: 'walrus://...', blobId: '...', hash: '...' });

await uploadToWalrus(file);
expect(uploadSpy).toHaveBeenCalledTimes(3);
```

---

### Requirement: Moment Registration on Sui

**Priority**: CRITICAL  
**Related**: `docs/frontend-design.md` Section 3.1, `openspec/specs/moment-registration/spec.md`

Admin MUST be able to register a moment on Sui using uploaded Walrus URIs in a single transaction.

#### Scenario: Successful moment registration

**Given**:
- Admin has successfully uploaded video and thumbnail to Walrus
- Video URI = "walrus://vid123"
- Thumbnail URI = "walrus://thumb456"
- Walrus hash = "abc123..."
- Admin wallet is connected
- Admin has AdminCap object

**When**:
- Admin fills in moment details:
  - match_id = "UFC300-001"
  - fighter_a = "Fighter A"
  - fighter_b = "Fighter B"
  - moment_type = "KO"
  - max_supply = 1000
- Admin clicks "登録" button
- Frontend constructs PTB calling `register_moment`
- Frontend signs and executes transaction

**Then**:
- Transaction succeeds
- New MintableMoment object is created on Sui
- Transaction digest is displayed
- Moment ID is displayed
- Success message: "Moment が正常に登録されました"
- Form is reset for next registration

**Verification**:
```typescript
// Check PTB construction
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::fight_moments::register_moment`,
  arguments: [
    tx.object(adminCapId),
    tx.pure.string('UFC300-001'),
    tx.pure.string('Fighter A'),
    tx.pure.string('Fighter B'),
    tx.pure.u8(0), // KO
    tx.pure.string('walrus://vid123'),
    tx.pure.string('walrus://thumb456'),
    tx.pure.string('abc123...'),
    tx.pure.u64(1000),
  ],
});

// Execute transaction
const result = await signAndExecuteTransaction({ transaction: tx });
expect(result.effects.status.status).toBe('success');
```

---

#### Scenario: Registration failure handling

**Given**:
- Admin has uploaded files successfully
- Admin fills in invalid data (e.g., invalid URI format)

**When**:
- Admin attempts to register moment
- Sui transaction fails

**Then**:
- Error message is displayed with transaction error details
- Form remains in editable state
- Uploaded files' URIs are preserved (no need to re-upload)
- Admin can correct data and retry

**Verification**:
```typescript
// Simulate transaction failure
await expect(registerMoment(invalidData)).rejects.toThrow();
expect(screen.getByText(/トランザクションが失敗しました/)).toBeInTheDocument();
```

---

### Requirement: Single-Screen Admin Workflow

**Priority**: HIGH  
**Related**: `docs/frontend-design.md` Section 3.1

Admin MUST complete the entire workflow (file selection → upload → registration) on a single screen.

#### Scenario: Complete workflow on one screen

**Given**:
- Admin navigates to `/admin` page

**When**:
- Admin sees a single form with:
  - Video file input
  - Thumbnail file input
  - match_id input
  - fighter_a input
  - fighter_b input
  - moment_type select
  - max_supply input
  - description textarea (optional)
  - "Upload and Register" button

**Then**:
- All inputs are present on the same screen
- Workflow progresses through states without navigation:
  1. File selection
  2. Upload (with progress)
  3. Registration (with Sui transaction)
  4. Success display
- Admin never leaves the `/admin` page

**Verification**:
```typescript
// Check all form elements present
expect(screen.getByLabelText('動画ファイル')).toBeInTheDocument();
expect(screen.getByLabelText('サムネイル画像')).toBeInTheDocument();
expect(screen.getByLabelText('Match ID')).toBeInTheDocument();
expect(screen.getByLabelText('Fighter A')).toBeInTheDocument();
expect(screen.getByLabelText('Fighter B')).toBeInTheDocument();
expect(screen.getByLabelText('Moment Type')).toBeInTheDocument();
expect(screen.getByLabelText('Max Supply')).toBeInTheDocument();
```

---

### Requirement: Error Distinction

**Priority**: MEDIUM  
**Related**: `docs/frontend-design.md` Section 3.1

The UI MUST distinguish between Walrus upload errors and Sui transaction errors.

#### Scenario: Walrus upload error display

**Given**:
- Admin attempts to upload files
- Walrus Upload Relay fails

**When**:
- Upload fails after all retries

**Then**:
- Error message clearly states: "Walrus アップロードに失敗しました: [error details]"
- Error is displayed in red/warning color
- Admin can retry upload without re-entering form data

**Verification**:
```typescript
expect(screen.getByText(/Walrus アップロードに失敗しました/)).toBeInTheDocument();
```

---

#### Scenario: Sui transaction error display

**Given**:
- Admin has successfully uploaded files
- Sui transaction fails (e.g., invalid AdminCap)

**When**:
- Transaction fails

**Then**:
- Error message clearly states: "Sui トランザクションに失敗しました: [error details]"
- Error is displayed in red/warning color
- Uploaded URIs are preserved (no need to re-upload)
- Admin can correct transaction parameters and retry

**Verification**:
```typescript
expect(screen.getByText(/Sui トランザクションに失敗しました/)).toBeInTheDocument();
```
