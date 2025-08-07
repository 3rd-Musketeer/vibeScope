import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_BASE } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert asset UUID to static image URL
 */
export function getImageUrl(assetUuid: string): string {
  return `${API_BASE}/static/assets/images/${assetUuid}.webp`
}

/**
 * Convert array of asset UUIDs to static image URLs
 */
export function getImageUrls(assetUuids: string[]): string[] {
  return assetUuids.map(uuid => getImageUrl(uuid))
}

/**
 * Get thumbnail URL for asset UUID
 */
export function getThumbnailUrl(assetUuid: string): string {
  return `${API_BASE}/static/assets/thumbnails/${assetUuid}.webp`
}

/**
 * Get avatar URL from asset UUID with fallback
 */
export function getAvatarUrl(avatarUuid: string, fallbackUrl?: string): string {
  if (avatarUuid) {
    return getThumbnailUrl(avatarUuid); // Use thumbnail size for avatars
  }
  return fallbackUrl || '/default-avatar.webp';
}
