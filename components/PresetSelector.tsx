'use client'

import { formatBytes, mbToBytes, PRESET_TARGETS } from '@/lib/utils'
import type { TargetPreset } from '@/lib/types'
import clsx from 'clsx'

interface PresetSelectorProps {
  preset: TargetPreset
  customMB: number
  originalSize: number
  onPresetChange: (p: TargetPreset) => void
  onCustomMBChange: (mb: number) => void
}

const PRESETS: { key: TargetPreset; emoji: string }[] = [
  { key: 'email', emoji: '✉️' },
  { key: 'ultra', emoji: '⚡' },
  { key: 'custom', emoji: '🎯' },
]

export function PresetSelector({
  preset,
  customMB,
  originalSize,
  onPresetChange,
  onCustomMBChange,
}: PresetSelectorProps) {
  const maxCustomMB = Math.max(0.1, Math.floor((originalSize / (1024 * 1024)) * 10) / 10)

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">
        Target size
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PRESETS.map(({ key, emoji }) => {
          const info = PRESET_TARGETS[key]
          const targetBytes = key === 'custom' ? mbToBytes(customMB) : info.bytes
          const tooLarge = targetBytes >= originalSize && key !== 'custom'

          return (
            <button
              key={key}
              type="button"
              onClick={() => onPresetChange(key)}
              disabled={tooLarge}
              className={clsx(
                'preset-card text-left transition-all',
                preset === key ? 'selected' : '',
                tooLarge ? 'opacity-40 cursor-not-allowed' : '',
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{emoji}</span>
                {preset === key && (
                  <span className="w-2 h-2 rounded-full bg-brand" />
                )}
              </div>
              <p className="font-display font-semibold text-sm text-ink leading-tight">
                {info.label}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-snug">
                {key === 'custom'
                  ? `You set: ${formatBytes(mbToBytes(customMB))}`
                  : info.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Custom size slider */}
      {preset === 'custom' && (
        <div className="mt-4 p-4 bg-paper-warm rounded-xl border border-paper-border animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              Custom target
            </label>
            <span className="font-mono text-sm font-medium text-ink">
              {formatBytes(mbToBytes(customMB))}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={maxCustomMB}
            step={0.1}
            value={customMB}
            onChange={(e) => onCustomMBChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-paper-border rounded-full appearance-none cursor-pointer accent-brand"
          />
          <div className="flex justify-between text-[10px] text-ink-faint mt-1.5 font-mono">
            <span>100 KB</span>
            <span>{formatBytes(originalSize)} (original)</span>
          </div>
        </div>
      )}

      {/* Size context */}
      <p className="text-xs text-ink-faint mt-3 text-center">
        Original:{' '}
        <span className="font-mono text-ink-muted">{formatBytes(originalSize)}</span>
        {' · '}
        Target:{' '}
        <span className="font-mono text-brand">
          {preset === 'custom'
            ? formatBytes(mbToBytes(customMB))
            : formatBytes(PRESET_TARGETS[preset].bytes)}
        </span>
      </p>
    </div>
  )
}
