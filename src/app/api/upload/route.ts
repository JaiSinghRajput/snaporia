import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadToS3 } from '@/lib/s3'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (formError) {
      console.error('Failed to parse FormData:', formError)
      return NextResponse.json(
        { error: 'Failed to parse body as FormData. Content-Type must be multipart/form-data.' },
        { status: 400 }
      )
    }
    
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      )
    }

    // Check file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const folder = isVideo ? 'videos' : 'images'
    const url = await uploadToS3(buffer, file.type, folder)

    return NextResponse.json({
      url,
      type: isVideo ? 'video' : 'image',
      size: file.size,
      name: file.name,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    const message = error instanceof Error ? error.message : 'Failed to upload file'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
