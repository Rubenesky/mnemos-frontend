import { describe, it, expect, beforeAll, vi } from 'vitest'

// localStorage stub needed by i18n/index.js
beforeAll(() => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
})

describe('asset_type i18n keys', () => {
  it('resolves photo and general in EN', async () => {
    const { i18n } = await import('../index.js')
    i18n.global.locale.value = 'en'
    const t = (key) => i18n.global.t(key)

    expect(t('asset_type.photo')).toBe('Photo')
    expect(t('asset_type.general')).toBe('General')
    expect(t('asset_type.video')).toBe('Video')
    expect(t('asset_type.audio')).toBe('Audio')
  })

  it('resolves photo and general in ES', async () => {
    const { i18n } = await import('../index.js')
    i18n.global.locale.value = 'es'
    const t = (key) => i18n.global.t(key)

    expect(t('asset_type.photo')).toBe('Foto')
    expect(t('asset_type.general')).toBe('General')
    expect(t('asset_type.video')).toBe('Vídeo')
    expect(t('asset_type.audio')).toBe('Audio')
  })

  it('does NOT return raw key for any consent_type backend value', async () => {
    const { i18n } = await import('../index.js')
    const backendValues = ['photo', 'video', 'audio', 'general']

    for (const locale of ['en', 'es']) {
      i18n.global.locale.value = locale
      for (const type of backendValues) {
        const result = i18n.global.t(`asset_type.${type}`)
        expect(result).not.toBe(`asset_type.${type}`)
      }
    }
  })
})
