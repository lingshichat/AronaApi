import { createFileRoute } from '@tanstack/react-router'
import { WalletPurchasePage } from '@/features/wallet/purchase-page'

export const Route = createFileRoute('/_authenticated/wallet/purchase')({
  component: WalletPurchasePage,
})
