import { Link } from '@tanstack/react-router'
import { ExternalLink, Gift, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { useTopupInfo } from './hooks'

export function WalletPurchasePage() {
  const { t } = useTranslation()
  const { topupInfo, loading } = useTopupInfo()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[60vh] w-full' />
        </CardContent>
      </Card>
    )
  }

  const enabled = !!topupInfo?.embedded_purchase_enabled
  const purchaseUrl = topupInfo?.embedded_purchase_url || ''
  const instructions =
    topupInfo?.embedded_purchase_instructions ||
    t('After purchase, copy the redemption code and redeem it in your wallet.')

  return (
    <TitledCard
      title={t('Purchase Redemption Code')}
      description={t('Buy a quota or subscription code from the embedded page')}
      icon={<ShoppingBag className='h-4 w-4' />}
      action={
        <Button variant='outline' size='sm' render={<Link to='/wallet' />}>
          <Gift className='h-4 w-4' />
          {t('Redeem in Wallet')}
        </Button>
      }
      contentClassName='space-y-4'
    >
      {!enabled ? (
        <div className='text-muted-foreground rounded-lg border p-4 text-sm'>
          {t('Embedded purchase is currently disabled.')}
        </div>
      ) : (
        <>
          {purchaseUrl ? (
            <div className='overflow-hidden rounded-xl border'>
              <iframe
                title={t('Embedded Purchase Page')}
                src={purchaseUrl}
                className='bg-background h-[65vh] w-full'
                sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
              />
            </div>
          ) : (
            <div className='text-muted-foreground rounded-lg border p-4 text-sm'>
              {t('No purchase URL configured.')}
            </div>
          )}

          <div className='bg-muted/40 space-y-3 rounded-lg border p-4'>
            <div className='text-sm whitespace-pre-wrap'>{instructions}</div>
            {purchaseUrl && (
              <Button
                variant='outline'
                render={
                  <a href={purchaseUrl} target='_blank' rel='noreferrer' />
                }
              >
                <ExternalLink className='h-4 w-4' />
                {t('Open purchase page externally')}
              </Button>
            )}
          </div>
        </>
      )}
    </TitledCard>
  )
}
