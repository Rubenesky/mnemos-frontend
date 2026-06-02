import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'audio/mpeg',
  'audio/wav',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024

function makeSetFile(selectedFile, toast) {
  return function setFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('File type not allowed. Use images, PDF, video or audio.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File exceeds the 10MB limit.')
      return
    }
    selectedFile.value = file
  }
}

describe('setFile — file validation', () => {
  let selectedFile
  let toast
  let setFile

  beforeEach(() => {
    selectedFile = ref(null)
    toast = { error: vi.fn() }
    setFile = makeSetFile(selectedFile, toast)
  })

  it('rejects a .exe file and calls toast.error', () => {
    const file = new File(['content'], 'malware.exe', { type: 'application/octet-stream' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith(
      'File type not allowed. Use images, PDF, video or audio.',
    )
    expect(selectedFile.value).toBeNull()
  })

  it('rejects a file larger than 10MB and calls toast.error', () => {
    const bigContent = new Uint8Array(11 * 1024 * 1024)
    const file = new File([bigContent], 'large.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).toHaveBeenCalledWith('File exceeds the 10MB limit.')
    expect(selectedFile.value).toBeNull()
  })

  it('accepts a valid .jpg and assigns selectedFile', () => {
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })

    setFile(file)

    expect(toast.error).not.toHaveBeenCalled()
    expect(selectedFile.value).toBe(file)
  })
})
