import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks, type TopNavLink } from '@/hooks/use-top-nav-links'
import { CopyButton } from '@/components/copy-button'
import type { SystemStatus } from '@/features/auth/types'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const ENDPOINT_SUFFIXES = [
  '/v1/responses',
  '/v1/chat/completions',
  '/v1/images/generations',
  '/v1/embeddings',
] as const

function getServerAddress(status: SystemStatus | null): string {
  const value =
    (status?.server_address as string | undefined) ??
    (status?.serverAddress as string | undefined) ??
    status?.data?.server_address ??
    (status?.data as Record<string, unknown> | undefined)?.serverAddress

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

function formatCopyableBaseUrl(address: string): string {
  const normalized = address.replace(/\/+$/, '')

  if (!normalized) return ''
  if (normalized.endsWith('/v1')) return normalized.slice(0, -3)

  return normalized
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

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const { status } = useStatus()
  const topNavLinks = useTopNavLinks()
  const displayName = systemName?.trim() || DEFAULT_SYSTEM_NAME
  const brandLabel = displayName.replace(/\s+/g, '').toUpperCase()
  const titleParts = splitApiSuffix(displayName)
  const docsNavLink = topNavLinks.find((link) => link.title === t('Docs'))
  const copyableBaseUrl = useMemo(
    () => formatCopyableBaseUrl(getServerAddress(status)),
    [status]
  )

  return (
    <section
      className={cn(
        'relative isolate flex min-h-svh flex-col overflow-hidden bg-[#030305] px-6 text-white',
        props.className
      )}
    >
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-30 bg-[#030305]' />
      <div aria-hidden className='landing-hero-aurora pointer-events-none -z-20' />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,3,5,0.18)_42%,rgba(3,3,5,0.9)_100%),linear-gradient(180deg,#030305_0%,#06060b_48%,#030305_100%)]'
      />
      <div
        aria-hidden
        className='landing-hero-noise pointer-events-none absolute inset-0 -z-10'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-white/[0.035] to-transparent'
      />

      <nav className='relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between'>
        <Link
          to='/'
          className='text-[11px] font-semibold tracking-[0.48em] text-white/45 transition-colors duration-300 hover:text-white/70'
        >
          {brandLabel}
        </Link>

        <div className='flex items-center gap-7 text-sm text-white/48'>
          {docsNavLink ? <HeroNavLink link={docsNavLink} /> : null}
          {props.isAuthenticated ? (
            <Link
              to='/dashboard'
              className='transition-colors duration-300 hover:text-white/80'
            >
              {t('Go to Dashboard')}
            </Link>
          ) : (
            <>
              <Link
                to='/sign-in'
                className='transition-colors duration-300 hover:text-white/80'
              >
                {t('Sign in')}
              </Link>
              <Link
                to='/sign-up'
                className='transition-colors duration-300 hover:text-white/80'
              >
                {t('Sign up')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className='relative z-10 flex flex-1 items-center justify-center pb-20'>
        <div className='landing-animate-fade-up flex w-full max-w-5xl flex-col items-center text-center'>
          <h1
            className='text-[clamp(4.5rem,13vw,11rem)] leading-none font-light tracking-[-0.075em] text-white'
            style={{ textShadow: '0 0 32px rgba(139, 92, 246, 0.18)' }}
          >
            <span>{titleParts.prefix}</span>
            <span className='landing-title-accent bg-gradient-to-r from-[#8cb2ff] via-[#9d85ff] to-[#b88cff] bg-clip-text text-transparent'>
              {titleParts.suffix}
            </span>
          </h1>
          <p className='mt-10 text-sm tracking-[0.42em] text-white/32 md:text-base'>
            {t('Convenient model access for everyone')}
          </p>
          <BaseUrlBox value={copyableBaseUrl} />
        </div>
      </div>
    </section>
  )
}

function HeroNavLink(props: { link: TopNavLink }) {
  const className = cn(
    'transition-colors duration-300 hover:text-white/80',
    props.link.disabled && 'pointer-events-none opacity-40'
  )

  if (props.link.external) {
    return (
      <a
        href={props.link.href}
        target='_blank'
        rel='noopener noreferrer'
        className={className}
        aria-disabled={props.link.disabled}
      >
        {props.link.title}
      </a>
    )
  }

  return (
    <Link to={props.link.href} className={className} disabled={props.link.disabled}>
      {props.link.title}
    </Link>
  )
}

function BaseUrlBox(props: { value: string }) {
  const { t } = useTranslation()
  const [endpointIndex, setEndpointIndex] = useState(0)
  const endpointSuffix = ENDPOINT_SUFFIXES[endpointIndex]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const timer = window.setInterval(() => {
      setEndpointIndex((index) => (index + 1) % ENDPOINT_SUFFIXES.length)
    }, 2200)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className='mt-14 w-full max-w-xl rounded-full border border-[#8a7cff]/[0.14] bg-[#07070d]/55 p-1.5 shadow-[0_22px_80px_rgba(38,28,96,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl'>
      <div className='flex h-12 items-center gap-3 rounded-full border border-white/[0.055] bg-[#0d0d16]/70 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]'>
        <code className='min-w-0 flex-1 truncate text-left font-sans text-sm tracking-[-0.025em] text-white/72 sm:text-base'>
          {props.value}
        </code>
        <code
          key={endpointSuffix}
          className='landing-animate-fade-up hidden shrink-0 font-sans text-sm font-medium tracking-[-0.025em] text-[#9f8cff]/75 sm:inline-block'
        >
          {endpointSuffix}
        </code>
        <CopyButton
          value={props.value}
          variant='ghost'
          size='icon'
          className='size-9 rounded-full bg-white/[0.07] text-white/45 hover:bg-[#8a7cff]/[0.16] hover:text-white/85'
          iconClassName='size-4'
          tooltip={t('Copy URL')}
          successTooltip={t('Copied!')}
          aria-label={t('Copy URL')}
        />
      </div>
    </div>
  )
}
