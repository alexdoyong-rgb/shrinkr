'use client'

import { useState, useCallback } from 'react'
import { Dropzone } from '@/components/Dropzone'
import { PresetSelector } from '@/components/PresetSelector'
import { CompressionResult } from '@/components/CompressionResult'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { TrustBadges } from '@/components/TrustBadges'
import type { TargetPreset, CompressionResult as CompressionResultType } from '@/lib/types'
import { mbToBytes, PRESET_TARGETS } from '@/lib/utils'

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export default function Home() {
  const [stage, setStage] = useState<Stage>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preset, setPreset] = useState<TargetPreset>('email')
  const [customMB, setCustomMB] = useState(2)
  const [result, setResult] = useState<CompressionResultType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleFileDrop = useCallback((file: File) => {
    setSelectedFile(file)
    setResult(null)
    setError(null)
    setStage('idle')
  }, [])

  const getTargetBytes = () => {
    if (preset === 'custom') return mbToBytes(customMB)
    return PRESET_TARGETS[preset].bytes
  }

  const handleCompress = async () => {
    if (!selectedFile) return

    setStage('uploading')
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('targetBytes', String(getTargetBytes()))

      const res = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setStage('error')
        return
      }

      setResult(data)
      setStage('done')
    } catch {
      setError('Network error. Please try again.')
      setStage('error')
    }
  }

  const handleCheckout = async () => {
    if (!result) return
    setIsCheckingOut(true)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: result.fileId,
          fileName: result.fileName,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Checkout failed. Please try again.')
        setIsCheckingOut(false)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch {
      setError('Failed to start checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  const handleReset = () => {
    setStage('idle')
    setSelectedFile(null)
    setResult(null)
    setError(null)
    setIsCheckingOut(false)
  }

  const isCompressing = stage === 'uploading'
  const showPresets = selectedFile && (stage === 'idle' || isCompressing)
  const showResult = stage === 'done' && result

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* Hero text */}
        <div className="text-center mb-10 animate-in">
          <div className="inline-flex items-center gap-2 bg-brand-faint text-brand text-xs font-medium px-3 py-1.5 rounded-full mb-5 font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft inline-block" />
            No signup. No friction. Just results.
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] tracking-tight mb-4">
            Make your file<br />
            <span className="text-brand">upload-ready</span> anywhere.
          </h1>
          <p className="text-ink-muted text-lg sm:text-xl max-w-md mx-auto leading-relaxed">
            Compress any image or PDF to your exact target size.
            Email it. Send it. Submit it. Done.
          </p>
        </div>

        {/* Main card */}
        <div className="w-full max-w-2xl animate-in animate-in-delay-1">
          <div className="bg-white rounded-3xl shadow-lift border border-paper-border overflow-hidden">
            {/* Drop zone */}
            <div className="p-6 sm:p-8">
              <Dropzone
                onFileDrop={handleFileDrop}
                selectedFile={selectedFile}
                isCompressing={stage === 'uploading'}
                onClear={handleReset}
              />
            </div>

            {/* Preset selector — shown once file is selected */}
            {showPresets && (
              <div className="border-t border-paper-border px-6 sm:px-8 py-6 animate-in">
                <PresetSelector
                  preset={preset}
                  customMB={customMB}
                  originalSize={selectedFile.size}
                  onPresetChange={setPreset}
                  onCustomMBChange={setCustomMB}
                />

                {error && (
                  <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCompress}
                  disabled={stage === 'uploading'}
                  className="btn-press mt-5 w-full flex items-center justify-center gap-2.5 bg-ink text-white font-display font-semibold text-base px-6 py-3.5 rounded-2xl hover:bg-ink-soft transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-subtle"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                  </svg>
                  Compress file
                </button>
              </div>
            )}

            {/* Compression result */}
            {showResult && (
              <div className="border-t border-paper-border px-6 sm:px-8 py-6 animate-in">
                <CompressionResult
                  result={result}
                  onCheckout={handleCheckout}
                  onReset={handleReset}
                  isCheckingOut={isCheckingOut}
                />
              </div>
            )}

            {/* Error when result stage fails */}
            {stage === 'error' && !showPresets && (
              <div className="border-t border-paper-border px-6 sm:px-8 py-6 animate-in">
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 mb-4">
                  {error}
                </div>
                <button onClick={handleReset} className="text-sm text-brand underline underline-offset-2">
                  Start over
                </button>
              </div>
            )}
          </div>

          {/* Trust signals */}
          <TrustBadges />
        </div>
      </div>

      <Footer />
    </main>
  )
}
