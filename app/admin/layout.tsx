import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Allow access to login page without auth
  // The middleware handles the redirect for protected routes

  return <>{children}</>
}

export async function generateMetadata() {
  return {
    title: 'Admin - ALAMAR BEACH HOUSE',
    description: 'Panel de administración de ALAMAR BEACH HOUSE',
  }
}
