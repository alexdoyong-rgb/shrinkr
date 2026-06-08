# Shrinkr — File Compression Micro-SaaS MVP

> **Make your file upload-ready anywhere in seconds.**  
> Compress images and PDFs to a target size, pay $1, download instantly. No signup.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Stripe Setup](#stripe-setup)
5. [Architecture](#architecture)
6. [Upgrading PDF Compression](#upgrading-pdf-compression)
7. [Upgrading to S3 Storage](#upgrading-to-s3-storage)
8. [Deployment (Vercel)](#deployment-vercel)

---

## Project Structure

```
shrinkr/
├── app/
│   ├── api/
│   │   ├── compress/route.ts        # Upload + compress file
│   │   ├── create-checkout/route.ts # Create Stripe session
│   │   ├── download/route.ts        # Verify payment + stream file
│   │   └── webhook/route.ts         # Stripe webhook handler
│   ├── success/page.tsx             # Post-payment download trigger
│   ├── cancel/page.tsx              # Cancelled checkout
│   ├── layout.tsx                   # Root layout + fonts
│   ├── page.tsx                     # Main app (full flow)
│   └── globals.css                  # Design system + animations
│
├── components/
│   ├── Dropzone.tsx                 # Drag-and-drop upload zone
│   ├── PresetSelector.tsx           # Email / Ultra light / Custom
│   ├── CompressionResult.tsx        # Before/after + checkout CTA
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── TrustBadges.tsx
│
├── lib/
│   ├── types.ts                     # Shared TypeScript interfaces
│   ├── utils.ts                     # formatBytes, presets, estimates
│   ├── compression.ts               # sharp (images) + PDF placeholder
│   ├── fileStore.ts                 # In-memory + /tmp file management
│   └── stripe.ts                    # Checkout session + webhook verify
│
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Stripe account](https://stripe.com) (free)
- Stripe CLI (for local webhook testing)

### 1. Install dependencies

```bash
cd shrinkr
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your values (see [Environment Variables](#environment-variables) below).

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Forward Stripe webhooks locally

In a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the `whsec_...` secret printed and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe Dashboard | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe CLI or Dashboard | ✅ |
| `NEXT_PUBLIC_APP_URL` | Full URL of your app (e.g. `https://shrinkr.app`) | ✅ |
| `PRICE_CENTS` | Price in cents (default: `100` = $1.00) | Optional |

---

## Stripe Setup

### Test mode (development)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers → API keys** → copy Secret + Publishable keys
3. Use test card: `4242 4242 4242 4242`, any future date, any CVC

### Webhook (local)

```bash
brew install stripe/stripe-cli/stripe   # macOS
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

### Webhook (production)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain.com/api/webhook`
3. Events to listen for: `checkout.session.completed`, `checkout.session.expired`
4. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Architecture

### Core flow

```
User drops file
     │
     ▼
POST /api/compress
  ├── Validate (type, size)
  ├── storeUpload() → writes to /tmp/shrinkr/{uuid}_original.jpg
  ├── compressFile() → sharp binary search for target quality
  ├── storeCompressed() → writes to /tmp/shrinkr/{uuid}_compressed.jpg
  └── Returns { fileId, originalSize, compressedSize, compressionRatio }
     │
     ▼
User clicks "Download for $1"
     │
     ▼
POST /api/create-checkout
  ├── Validates fileId exists in memory
  ├── Creates Stripe Checkout session
  └── Returns { url }
     │
     ▼
Stripe Checkout (hosted by Stripe)
     │
     ▼ (on success)
/success?session_id=cs_...
     │
     ▼
GET /api/download?session_id=cs_...
  ├── getSessionMetadata() → verifies payment_status === 'paid'
  ├── Streams compressed file to browser
  └── deleteRecord() → removes files from disk + memory
```

### File lifetime

- Files stored in `/tmp/shrinkr/` on the server
- Auto-deleted after **15 minutes** (Node `setTimeout`)
- Also deleted immediately after download
- No database needed — all state is in-process memory

> ⚠️ **Note:** In-memory state is lost on server restart. For production, use Redis or a database for the file registry. See [S3 upgrade notes](#upgrading-to-s3-storage).

---

## Upgrading PDF Compression

The current PDF handler copies the file unchanged and returns a simulated size. To wire in real compression:

### Option A — Ghostscript (server-based)

Install Ghostscript on your server, then replace the `compressPdf` function body in `lib/compression.ts`:

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function compressPdf(opts: CompressOptions, originalSize: number) {
  await execAsync(
    `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
     -dNOPAUSE -dQUIET -dBATCH \
     -sOutputFile="${opts.outputPath}" "${opts.inputPath}"`
  )
  const stat = await fs.stat(opts.outputPath)
  return { outputPath: opts.outputPath, originalSize, compressedSize: stat.size }
}
```

`-dPDFSETTINGS` options: `/screen` (72 dpi), `/ebook` (150 dpi), `/printer` (300 dpi), `/prepress`

### Option B — ilovepdf API

```bash
npm install @ilovepdf/ilovepdf-nodejs
```

```typescript
import ILovePDF from '@ilovepdf/ilovepdf-nodejs'

const ilovepdf = new ILovePDF(process.env.ILOVEPDF_PUBLIC_KEY, process.env.ILOVEPDF_SECRET_KEY)
const task = ilovepdf.newTask('compress')
await task.start()
await task.addFile(opts.inputPath)
await task.process()
await task.download(opts.outputPath)
```

### Option C — pdf-lib (pure JS, limited)

Good for removing metadata and optimizing structure; less effective on image-heavy PDFs.

---

## Upgrading to S3 Storage

Replace `lib/fileStore.ts` with an S3 implementation:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.AWS_S3_BUCKET!

export async function storeUpload(buffer: Buffer, name: string, mimeType: string, targetBytes: number) {
  const fileId = uuidv4()
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `uploads/${fileId}/original`,
    Body: buffer,
    ContentType: mimeType,
    // Auto-delete after 15 minutes via S3 lifecycle rule
  }))
  return fileId
}
```

Set up an S3 lifecycle rule to expire objects under `uploads/` after 15 minutes for automatic cleanup.

For the download route, generate a **pre-signed URL** valid for 5 minutes instead of streaming directly through your server.

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Update `NEXT_PUBLIC_APP_URL` to your production domain.

Register your production webhook URL in Stripe Dashboard.

> **Important:** Vercel functions have a `/tmp` directory but it's ephemeral and not shared across instances. For production with multiple instances, you **must** use S3 + Redis/database for the file registry.

---

## Design System

The UI uses:

- **Syne** (display/headings) — geometric, confident
- **DM Sans** (body) — clean, readable
- **DM Mono** (numbers, badges) — precise

Colors: paper (`#FAFAF8`), ink (`#0F0F0F`), brand blue (`#2563EB`), success green (`#16A34A`)

All animations use `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like) for a premium feel.

---

## Replacing Mock with Real (Quick Checklist)

- [ ] PDF: Wire in Ghostscript or ilovepdf API in `lib/compression.ts`
- [ ] Storage: Swap `/tmp` for S3 in `lib/fileStore.ts`
- [ ] Registry: Add Redis for multi-instance file tracking
- [ ] Analytics: Add Plausible/PostHog event on checkout + download
- [ ] Email: Send receipt via Resend/Postmark in webhook handler
- [ ] Rate limiting: Add IP-based limits on `/api/compress`
- [ ] CORS: Lock API routes to your domain
