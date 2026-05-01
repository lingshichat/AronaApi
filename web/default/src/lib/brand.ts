import { DEFAULT_SYSTEM_NAME } from './constants'

export function getBrandDisplayName(name?: string | null): string {
  const normalized = name?.trim()
  return normalized || DEFAULT_SYSTEM_NAME
}
