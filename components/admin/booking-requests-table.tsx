'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  MoreVertical, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  MessageCircle
} from 'lucide-react'

interface BookingRequest {
  id: string
  full_name: string
  email: string
  phone: string
  check_in: string
  check_out: string
  guests: number
  message: string | null
  status: string
  created_at: string
  updated_at: string
}

interface Props {
  requests: BookingRequest[]
  compact?: boolean
}

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-[#D97706] bg-[#FEF3C7]' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, color: 'text-[#059669] bg-[#D1FAE5]' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'text-[#DC2626] bg-[#FEE2E2]' },
  completed: { label: 'Completada', icon: Check, color: 'text-[#6B7280] bg-[#F3F4F6]' },
}

export default function BookingRequestsTable({ requests, compact = false }: Props) {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id)
    setOpenMenu(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      // If confirming, create a calendar block
      if (newStatus === 'confirmed') {
        const request = requests.find(r => r.id === id)
        if (request) {
          await supabase.from('calendar_blocks').insert({
            start_date: request.check_in,
            end_date: request.check_out,
            note: `Reserva de ${request.full_name}`,
            source: 'booking',
            booking_request_id: id,
          })
        }
      }

      // If cancelling, remove the calendar block
      if (newStatus === 'cancelled') {
        await supabase
          .from('calendar_blocks')
          .delete()
          .eq('booking_request_id', id)
      }

      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setUpdating(null)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: compact ? undefined : 'numeric',
    })
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function openWhatsApp(phone: string, name: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    const message = encodeURIComponent(`Hola ${name}, te contactamos de ALAMAR BEACH HOUSE respecto a tu solicitud de reserva.`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  if (requests.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-sans text-sm text-[#666666]">No hay solicitudes todavía.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E3D8]">
            <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
              Cliente
            </th>
            <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
              Fechas
            </th>
            {!compact && (
              <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
                Huéspedes
              </th>
            )}
            <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
              Estado
            </th>
            {!compact && (
              <th className="px-6 py-3 text-left font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
                Recibida
              </th>
            )}
            <th className="px-6 py-3 text-right font-sans text-xs font-semibold text-[#666666] uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <tr key={request.id} className="border-b border-[#E8E3D8] last:border-b-0 hover:bg-[#FAFAF8]">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-sans text-sm font-medium text-[#2C2C2C]">
                      {request.full_name}
                    </p>
                    <p className="font-sans text-xs text-[#666666]">{request.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-sans text-sm text-[#2C2C2C]">
                    {formatDate(request.check_in)} — {formatDate(request.check_out)}
                  </p>
                </td>
                {!compact && (
                  <td className="px-6 py-4">
                    <p className="font-sans text-sm text-[#2C2C2C]">{request.guests}</p>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium ${status.color}`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </td>
                {!compact && (
                  <td className="px-6 py-4">
                    <p className="font-sans text-sm text-[#666666]">{formatDateTime(request.created_at)}</p>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openWhatsApp(request.phone, request.full_name)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#25D366]/10 text-[#25D366] transition-colors"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === request.id ? null : request.id)}
                        disabled={updating === request.id}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E8E3D8] text-[#666666] transition-colors disabled:opacity-50"
                      >
                        {updating === request.id ? (
                          <div className="w-4 h-4 border-2 border-[#1B4D5C] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <MoreVertical size={18} />
                        )}
                      </button>
                      {openMenu === request.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenu(null)} 
                          />
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8E3D8] rounded-lg shadow-lg z-20 py-1">
                            {request.status !== 'confirmed' && (
                              <button
                                onClick={() => updateStatus(request.id, 'confirmed')}
                                className="w-full px-4 py-2 text-left font-sans text-sm text-[#059669] hover:bg-[#D1FAE5]/50 flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Confirmar
                              </button>
                            )}
                            {request.status !== 'cancelled' && (
                              <button
                                onClick={() => updateStatus(request.id, 'cancelled')}
                                className="w-full px-4 py-2 text-left font-sans text-sm text-[#DC2626] hover:bg-[#FEE2E2]/50 flex items-center gap-2"
                              >
                                <XCircle size={16} />
                                Cancelar
                              </button>
                            )}
                            {request.status === 'confirmed' && (
                              <button
                                onClick={() => updateStatus(request.id, 'completed')}
                                className="w-full px-4 py-2 text-left font-sans text-sm text-[#6B7280] hover:bg-[#F3F4F6] flex items-center gap-2"
                              >
                                <Check size={16} />
                                Marcar completada
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
