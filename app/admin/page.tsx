import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Fetch booking requests
  const { data: bookingRequests } = await supabase
    .from('booking_requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch calendar blocks
  const { data: calendarBlocks } = await supabase
    .from('calendar_blocks')
    .select('*')
    .order('start_date', { ascending: true })

  // Get stats
  const pendingCount = bookingRequests?.filter(r => r.status === 'pending').length || 0
  const confirmedCount = bookingRequests?.filter(r => r.status === 'confirmed').length || 0
  const totalRequests = bookingRequests?.length || 0

  return (
    <AdminDashboard
      user={user}
      bookingRequests={bookingRequests || []}
      calendarBlocks={calendarBlocks || []}
      stats={{
        pendingCount,
        confirmedCount,
        totalRequests,
      }}
    />
  )
}
