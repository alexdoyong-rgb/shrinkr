import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shrinkr — Make your file upload-ready in seconds',
  description:
    'Compress any image or PDF to a target size instantly. Email-ready, Discord-ready, anywhere-ready. No signup required.',
  keywords: ['file compression', 'image compressor', 'pdf compressor', 'reduce file size'],
  openGraph: {
    title: 'Shrinkr — Compress files to any size',
    description: 'Make your file upload-ready anywhere in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-paper font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
