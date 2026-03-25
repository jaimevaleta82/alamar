import { Suspense } from 'react'
import Navbar from '@/components/shared/navbar'
import Footer from '@/components/shared/footer'
import PaymentResult from '@/components/payment/payment-result'
import type { TransactionStatus } from '@/lib/wompi'

interface PageProps {
  searchParams: Promise<{
    id?: string
    'transaction.id'?: string
    'transaction.status'?: string
    'transaction.reference'?: string
    status?: string
    reference?: string
  }>
}

/**
 * /pago/resultado
 *
 * Wompi redirects here after hosted checkout with query params:
 *   transaction.id        — Wompi transaction ID
 *   transaction.status    — APPROVED | PENDING | DECLINED | ERROR
 *   transaction.reference — your reservation reference
 *
 * We also support ?status=PENDING&reference=... for non-Wompi redirects.
 */
export default async function PagoResultadoPage({ searchParams }: PageProps) {
  const params = await searchParams

  const status =
    (params['transaction.status'] as TransactionStatus) ??
    (params.status?.toUpperCase() as TransactionStatus) ??
    'PENDING'

  const reference = params['transaction.reference'] ?? params.reference ?? null
  const transactionId = params['transaction.id'] ?? params.id ?? null

  return (
    <>
      <Navbar />
      <Suspense>
        <PaymentResult
          status={status}
          reference={reference}
          transactionId={transactionId}
        />
      </Suspense>
      <Footer />
    </>
  )
}

export async function generateMetadata() {
  return {
    title: 'Resultado del pago — ALAMAR HOUSE',
    description: 'Estado de tu reserva en ALAMAR HOUSE, Playa Blanca, San Antero.',
  }
}
