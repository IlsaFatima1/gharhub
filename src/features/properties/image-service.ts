import { supabase } from '../../lib/supabase'

export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image processing is not available in this browser.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', .82))
  if (!blob) throw new Error('Could not optimize this image.')
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' })
}

export async function uploadPropertyImage(file: File, ownerId: string): Promise<string> {
  const optimized = await compressImage(file)
  if (!supabase) return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read image.')); reader.readAsDataURL(optimized) })
  const path = `${ownerId}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage.from('property-images').upload(path, optimized, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
  if (error) throw new Error(error.message)
  return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl
}
