/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
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
