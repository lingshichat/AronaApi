import type { HTMLAttributes, ImgHTMLAttributes } from 'react'
import { getBrandDisplayName } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandWordmarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'hero'
type BrandSymbolSize = 'xs' | 'sm' | 'md' | 'lg'

type BrandWordmarkProps = HTMLAttributes<HTMLSpanElement> & {
  name?: string | null
  size?: BrandWordmarkSize
  animated?: boolean
}

type BrandIconImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt'
> & {
  name?: string | null
  size?: BrandSymbolSize
  alt?: string
}

const wordmarkSizeClass: Record<BrandWordmarkSize, string> = {
  xs: 'text-base font-light tracking-[-0.055em]',
  sm: 'text-xl font-light tracking-[-0.06em]',
  md: 'text-2xl font-light tracking-[-0.065em]',
  lg: 'text-4xl font-light tracking-[-0.07em]',
  hero: 'text-[clamp(4.5rem,13vw,11rem)] font-light tracking-[-0.075em]',
}

const symbolSizeClass: Record<BrandSymbolSize, string> = {
  xs: 'size-5 text-sm',
  sm: 'size-6 text-base',
  md: 'size-8 text-xl',
  lg: 'size-12 text-3xl',
}

function splitApiSuffix(name: string): { prefix: string; suffix: string } {
  const match = name.match(/^(.*?)(api)$/i)

  if (!match) {
    return { prefix: name, suffix: '' }
  }

  return {
    prefix: match[1],
    suffix: match[2],
  }
}

export function BrandWordmark({
  name,
  size = 'sm',
  animated = false,
  className,
  ...props
}: BrandWordmarkProps) {
  const parts = splitApiSuffix(getBrandDisplayName(name))

  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap leading-none text-current',
        wordmarkSizeClass[size],
        className
      )}
      {...props}
    >
      <span>{parts.prefix}</span>
      <span
        className={cn(
          'bg-gradient-to-r from-[#8cb2ff] via-[#9d85ff] to-[#b88cff] bg-clip-text text-transparent',
          animated && 'landing-title-accent'
        )}
      >
        {parts.suffix}
      </span>
    </span>
  )
}

export function BrandIconImage({
  name,
  size = 'md',
  alt,
  className,
  ...props
}: BrandIconImageProps) {
  const displayName = getBrandDisplayName(name)

  return (
    <img
      src='/arona-mark.svg'
      alt={alt ?? displayName}
      className={cn('shrink-0 object-contain', symbolSizeClass[size], className)}
      {...props}
    />
  )
}
