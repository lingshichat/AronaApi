import { cn } from '@/lib/utils'
import { BrandIconImage } from '@/components/brand-wordmark'

interface HeaderLogoProps {
  src: string
  alt?: string
  loading: boolean
  logoLoaded: boolean
  className?: string
}

/**
 * Logo component for header with loading state.
 * Shows unified AronaApi-style brand symbol by default.
 */
export function HeaderLogo({
  src: _src,
  alt = 'logo',
  loading,
  logoLoaded,
  className,
}: HeaderLogoProps) {
  const ready = !loading && logoLoaded

  return (
    <BrandIconImage
      alt={alt}
      className={cn(!ready && 'opacity-0', className)}
    />
  )
}
