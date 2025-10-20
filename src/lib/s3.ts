import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

const REGION = process.env.AWS_REGION!
const BUCKET = process.env.AWS_S3_BUCKET!
const PREFIX = (process.env.AWS_S3_PREFIX || '').replace(/^\/+|\/+$/g, '') // trim leading/trailing slashes

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

function joinPath(...parts: string[]) {
  return parts
    .filter(Boolean)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .join('/')
}

export async function uploadToS3(file: Buffer, fileType: string, folder = 'uploads') {
  const ext = fileType.split('/')[1] || 'bin'
  const key = joinPath(PREFIX, folder, `${uuidv4()}.${ext}`)

  // Some buckets have ACLs disabled (bucket owner enforced), so don't set ACL here
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: fileType,
  })

  await s3.send(command)
  // Region-aware URL format (virtual-hosted–style)
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}
