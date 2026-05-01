import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { BrandIconImage } from '@/components/brand-wordmark'

type LoaderIconProps = {
  size?: number
}

const LoaderIcon = ({ size = 16 }: LoaderIconProps) => (
  <BrandIconImage style={{ width: size, height: size }} />
)

export type LoaderProps = HTMLAttributes<HTMLDivElement> & {
  size?: number
}

export const Loader = ({ className, size = 16, ...props }: LoaderProps) => (
  <div
    className={cn(
      'inline-flex animate-pulse items-center justify-center',
      className
    )}
    {...props}
  >
    <LoaderIcon size={size} />
  </div>
)
