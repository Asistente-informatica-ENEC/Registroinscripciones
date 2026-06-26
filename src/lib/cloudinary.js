const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`

export function getCloudinaryUrl(publicId, options = {}) {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options
  const transformations = [
    width && `w_${width}`,
    height && `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    `f_${format}`,
  ]
    .filter(Boolean)
    .join(',')

  return `${BASE_URL}/${transformations}/${publicId}`
}

export function getUploadWidgetOptions() {
  return {
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    uploadPreset: UPLOAD_PRESET,
  }
}

export { CLOUD_NAME, API_KEY, UPLOAD_PRESET }
