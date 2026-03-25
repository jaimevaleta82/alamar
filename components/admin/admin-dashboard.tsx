'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  LogOut, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  ChevronDown
} from 'lucide-react'
import BookingRequestsTable from './booking-requests-table'
import AdminCalendar from './admin-calendar'

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

interface CalendarBlock {
  id: string
  start_date: string
  end_date: string
  note: string | null
  source: string
  booking_request_id: string | null
  created_at: string
}

interface Props {
  user: { email?: string }
  bookingRequests: BookingRequest[]
  calendarBlocks: CalendarBlock[]
  stats: {
    pendingCount: number
    confirmedCount: number
    totalRequests: number
  }
}

type Tab = 'dashboard' | 'requests' | 'calendar'

export default function AdminDashboard({ user, bookingRequests, calendarBlocks, stats }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests' as Tab, label: 'Solicitudes', icon: FileText, badge: stats.pendingCount > 0 ? stats.pendingCount : undefined },
    { id: 'calendar' as Tab, label: 'Calendario', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-[#1B4D5C] border-b border-[#1B4D5C]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-serif text-xl font-bold text-white">ALAMAR</h1>
              <p className="font-sans text-xs text-[#D4A574] tracking-wide">ADMIN PANEL</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-sm text-white/80">{user.email}</span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 font-sans text-sm text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-[#E8E3D8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-4 font-sans text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === item.id
                    ? 'text-[#1B4D5C] border-[#1B4D5C] font-semibold'
                    : 'text-[#666666] border-transparent hover:text-[#2C2C2C] hover:border-[#E8E3D8]'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {item.badge && (
                  <span className="bg-[#D97373] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FEF3C7] rounded-full flex items-center justify-center">
                    <Clock size={24} className="text-[#D97706]" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-[#666666]">Pendientes</p>
                    <p className="font-serif text-3xl font-bold text-[#2C2C2C]">{stats.pendingCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#D1FAE5] rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-[#059669]" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-[#666666]">Confirmadas</p>
                    <p className="font-serif text-3xl font-bold text-[#2C2C2C]">{stats.confirmedCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E0E7FF] rounded-full flex items-center justify-center">
                    <Users size={24} className="text-[#4F46E5]" />
                  </div>
                  <div>
                    <p className="font-sans text-sm text-[#666666]">Total solicitudes</p>
                    <p className="font-serif text-3xl font-bold text-[#2C2C2C]">{stats.totalRequests}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white border border-[#E8E3D8] rounded-lg">
              <div className="px-6 py-4 border-b border-[#E8E3D8] flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-[#2C2C2C]">
                  Solicitudes recientes
                </h2>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="font-sans text-sm text-[#1B4D5C] hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <BookingRequestsTable 
                requests={bookingRequests.slice(0, 5)} 
                compact 
              />
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white border border-[#E8E3D8] rounded-lg">
            <div className="px-6 py-4 border-b border-[#E8E3D8]">
              <h2 className="font-serif text-lg font-semibold text-[#2C2C2C]">
                Todas las solicitudes
              </h2>
            </div>
            <BookingRequestsTable requests={bookingRequests} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <AdminCalendar calendarBlocks={calendarBlocks} />
        )}
      </main>
    </div>
  )
}
