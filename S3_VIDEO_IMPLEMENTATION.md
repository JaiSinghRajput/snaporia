# S3 Upload Integration & Video Support - Implementation Summary

## What Was Implemented

### 1. S3 Upload Utility (`src/lib/s3.ts`)
- Created AWS S3 client configuration
- Added `uploadToS3()` function to upload files to S3
- Generates unique file names using UUID
- Stores files in separate folders (images, videos)
- Returns public S3 URLs

### 2. Upload API Route (`src/app/api/upload/route.ts`)
- Secure endpoint for handling file uploads
- Validates user authentication (requires logged-in user)
- File size limit: 100MB
- Supported image types: JPEG, PNG, GIF, WebP
- Supported video types: MP4, WebM, QuickTime, AVI
- Returns uploaded file URL and metadata

### 3. Enhanced CreatePost Component (`src/components/posts/CreatePost.tsx`)
**New Features:**
- **Image Upload**: Click upload button to select images from device
- **Video Upload**: Click video button to upload videos
- **URL Support**: Still supports pasting image URLs (original feature)
- **Upload Progress**: Shows "Uploading image..." or "Uploading video..." during upload
- **Video Preview**: Displays video preview with controls before posting
- **Smart Validation**: 
  - Can't upload images if video is present
  - Can't upload video if images are present
  - Max 4 images OR 1 video per post
- **Visual Feedback**: Upload and video icons in the toolbar

### 4. Updated PostCard Component (`src/components/posts/PostCard.tsx`)
- Added support for displaying videos
- HTML5 video player with controls
- Proper aspect ratio handling (max 500px height)
- Videos displayed before images in the post layout

### 5. Environment Variables (`.env.local`)
```bash
# Note: Using SNAPORIA_ prefix for Netlify compatibility
# (Netlify reserves AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
SNAPORIA_AWS_REGION="your-region"
SNAPORIA_AWS_ACCESS_KEY_ID=your-access-key-id
SNAPORIA_AWS_SECRET_ACCESS_KEY=your-secret-access-key
SNAPORIA_AWS_S3_BUCKET="your-bucket-name"
SNAPORIA_AWS_S3_PREFIX="snaporia"
```

## How It Works

### Upload Flow:
1. User clicks upload/video button in CreatePost
2. File picker opens
3. User selects image or video file
4. File is sent to `/api/upload` endpoint
5. API validates file type and size
6. File is uploaded to AWS S3
7. S3 URL is returned and displayed in preview
8. User clicks "Post" button
9. Post is created with the S3 URL(s)
10. PostCard displays the media from S3

### Post Creation Flow:
- User can add content (text) + images OR video
- Images: Up to 4 images (URL or upload)
- Video: 1 video (upload only for now)
- At least one of: content, images, or video is required

## Features Retained:
✅ Image URL support (paste URLs)
✅ Up to 4 images per post
✅ Post validation
✅ Upload progress feedback
✅ Image/video previews before posting
✅ Remove uploaded media before posting

## New Capabilities:
✅ Upload images from device to S3
✅ Upload videos from device to S3
✅ Display videos in feed with HTML5 player
✅ 100MB file size limit
✅ Secure authenticated uploads
✅ Organized S3 folder structure (images/, videos/)

## Testing Instructions:

1. **Test Image Upload:**
   - Open the app at http://localhost:3001
   - Click "Create Post"
   - Click the upload icon (cloud with arrow)
   - Select an image file
   - Wait for upload to complete
   - See image preview
   - Click "Post"
   - Verify image appears in feed

2. **Test Video Upload:**
   - Click "Create Post"
   - Click the video icon
   - Select a video file (MP4, WebM, etc.)
   - Wait for upload (may take longer for large videos)
   - See video preview with controls
   - Click "Post"
   - Verify video appears in feed with player controls

3. **Test URL Support (Still Works):**
   - Click "Create Post"
   - Paste an image URL in the text field
   - Click the image icon to add it
   - Click "Post"
   - Verify image from URL appears in feed

## Dependencies Installed:
- `@aws-sdk/client-s3` - AWS S3 SDK for Node.js
- `uuid` - Generate unique file names

## Next Steps (Optional Enhancements):
- [ ] Add video URL paste support (like images)
- [ ] Add video thumbnails/posters
- [ ] Add upload progress bar (percentage)
- [ ] Add image/video compression before upload
- [ ] Add drag-and-drop upload
- [ ] Add multiple video support
- [ ] Add video duration limit
- [ ] Add image editing (crop, rotate, filters)
- [ ] Add CDN for faster video delivery
- [ ] Add video transcoding for different formats

## Notes:
- Videos are stored in S3 as-is (no transcoding yet)
- Make sure your S3 bucket has public read permissions for uploaded files
- Consider adding CloudFront CDN for better video streaming performance
- For production, consider adding virus scanning for uploaded files
