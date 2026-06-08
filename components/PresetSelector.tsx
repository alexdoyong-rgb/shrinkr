'use client'

import { formatBytes, mbToBytes, PRESET_TARGETS } from '@/lib/utils'
import type { TargetPreset } from '@/lib/types'

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

export function PresetSelector({ preset, customMB, originalSize, onPresetChange, onCustomMBChange }: PresetSelectorProps) {
  const maxCustomMB = Math.max(0.1, Math.floor((originalSize / (1024 * 1024)) * 10) / 10)

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Target size
      </label>

      <div className="grid grid-cols-3 gap-2">
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
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                preset === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              } ${tooLarge ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-lg mb-1">{emoji}</div>
              <p className="font-semibold text-sm text-gray-900 leading-tight">{info.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {key === 'custom' ? `${formatBytes(mbToBytes(customMB))}` : info.description}
              </p>
            </button>
          )
        })}
      </div>

      {preset === 'custom' && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom target</label>
            <span className="text-sm font-medium text-gray-900">{formatBytes(mbToBytes(customMB))}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={maxCustomMB}
            step={0.1}
            value={customMB}
            onChange={(e) => onCustomMBChange(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>100 KB</span>
            <span>{formatBytes(originalSize)} (original)</span>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Original: <span className="text-gray-600">{formatBytes(originalSize)}</span>
        {' · '}
        Target: <span className="text-blue-600 font-medium">
          {preset === 'custom' ? formatBytes(mbToBytes(customMB)) : formatBytes(PRESET_TARGETS[preset].bytes)}
        </span>
      </p>
    </div>
  )
}
