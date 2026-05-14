import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getBrandDisplayName } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks, type TopNavLink } from '@/hooks/use-top-nav-links'
import { Button } from '@/components/ui/button'
import { BrandWordmark } from '@/components/brand-wordmark'
import { CopyButton } from '@/components/copy-button'
import type { SystemStatus } from '@/features/auth/types'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const COMMON_ENDPOINTS = [
  '/v1/responses',
  '/v1/chat/completions',
  '/v1/images/generations',
  '/v1/embeddings',
] as const

const ENDPOINT_SUFFIXES = COMMON_ENDPOINTS

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

function formatSdkBaseUrl(baseUrl: string): string {
  if (!baseUrl) return ''

  return `${baseUrl}/v1`
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const { status } = useStatus()
  const topNavLinks = useTopNavLinks()
  const displayName = getBrandDisplayName(systemName)
  const brandLabel = displayName.replace(/\s+/g, '').toUpperCase()
  const docsNavLink = topNavLinks.find((link) => link.title === t('Docs'))
  const copyableBaseUrl = useMemo(
    () => formatCopyableBaseUrl(getServerAddress(status)),
    [status]
  )
  const sdkBaseUrl = useMemo(
    () => formatSdkBaseUrl(copyableBaseUrl),
    [copyableBaseUrl]
  )

  return (
    <section
      className={cn(
        'relative isolate flex min-h-svh flex-col overflow-hidden bg-[#030305] px-6 text-white',
        props.className
      )}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-30 bg-[#030305]'
      />
      <div
        aria-hidden
        className='landing-hero-aurora pointer-events-none -z-20'
      />
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
            className='text-white'
            style={{ textShadow: '0 0 32px rgba(139, 92, 246, 0.18)' }}
          >
            <BrandWordmark name={displayName} size='hero' animated />
          </h1>
          <p className='mt-10 text-sm tracking-[0.42em] text-white/32 md:text-base'>
            {t('Convenient model access for everyone')}
          </p>
          <BaseUrlBox value={copyableBaseUrl} />
          <IntegrationGuide
            sdkBaseUrl={sdkBaseUrl}
            isAuthenticated={props.isAuthenticated}
          />
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
    <Link
      to={props.link.href}
      className={className}
      disabled={props.link.disabled}
    >
      {props.link.title}
    </Link>
  )
}

function IntegrationGuide(props: {
  sdkBaseUrl: string
  isAuthenticated?: boolean
}) {
  const { t } = useTranslation()
  const apiKeyPath = props.isAuthenticated ? '/keys' : '/sign-in'

  return (
    <div className='mt-8 w-full max-w-3xl rounded-[1.75rem] border border-white/[0.07] bg-white/[0.035] p-3 text-left shadow-[0_18px_70px_rgba(22,18,58,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl sm:p-4'>
      <div className='grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'>
        <div className='rounded-[1.35rem] border border-white/[0.055] bg-[#080811]/55 p-4'>
          <p className='text-[10px] font-semibold tracking-[0.34em] text-[#9f8cff]/65 uppercase'>
            {t('New API compatible')}
          </p>
          <p className='mt-2 text-sm leading-6 text-white/58'>
            {t('Use the OpenAI SDK with this endpoint and your API key.')}
          </p>
          <div className='mt-4 space-y-2.5'>
            <IntegrationCodeRow
              label={t('SDK Base URL')}
              value={props.sdkBaseUrl}
              copyValue={props.sdkBaseUrl}
              copyLabel={t('Copy SDK Base URL')}
            />
            <IntegrationCodeRow
              label={t('Auth header')}
              value='Authorization: Bearer <API_KEY>'
            />
          </div>
        </div>

        <div className='flex flex-col justify-between rounded-[1.35rem] border border-white/[0.055] bg-[#080811]/40 p-4'>
          <div>
            <p className='text-[10px] font-semibold tracking-[0.34em] text-white/36 uppercase'>
              {t('Common endpoints')}
            </p>
            <div className='mt-3 flex flex-wrap gap-2'>
              {COMMON_ENDPOINTS.map((endpoint) => (
                <code
                  key={endpoint}
                  className='rounded-full border border-[#8a7cff]/[0.12] bg-[#8a7cff]/[0.06] px-2.5 py-1 font-sans text-[11px] tracking-[-0.015em] text-white/58'
                >
                  {endpoint}
                </code>
              ))}
            </div>
          </div>
          <Button
            size='sm'
            className='mt-5 h-9 w-fit rounded-full border border-[#8a7cff]/[0.22] bg-white/[0.08] px-4 text-xs font-medium text-white/78 shadow-[0_10px_34px_rgba(80,70,160,0.18)] hover:bg-[#8a7cff]/[0.16] hover:text-white'
            render={<Link to={apiKeyPath} />}
          >
            <KeyRound className='size-3.5' />
            {props.isAuthenticated ? t('Manage API keys') : t('Get API key')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function IntegrationCodeRow(props: {
  label: string
  value: string
  copyValue?: string
  copyLabel?: string
}) {
  const { t } = useTranslation()

  return (
    <div className='flex items-center gap-2 rounded-full border border-white/[0.055] bg-black/20 px-3 py-2'>
      <span className='hidden shrink-0 text-[10px] font-medium tracking-[0.16em] text-white/32 uppercase sm:inline'>
        {props.label}
      </span>
      <code className='min-w-0 flex-1 truncate font-sans text-xs tracking-[-0.02em] text-white/68'>
        {props.value}
      </code>
      {props.copyValue ? (
        <CopyButton
          value={props.copyValue}
          variant='ghost'
          size='icon'
          className='size-7 rounded-full bg-white/[0.06] text-white/38 hover:bg-[#8a7cff]/[0.16] hover:text-white/85'
          iconClassName='size-3.5'
          tooltip={props.copyLabel ?? t('Copy to clipboard')}
          successTooltip={t('Copied!')}
          aria-label={props.copyLabel ?? t('Copy to clipboard')}
        />
      ) : null}
    </div>
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
