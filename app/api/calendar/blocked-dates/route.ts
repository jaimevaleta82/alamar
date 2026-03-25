import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('calendar_blocks')
      .select('start_date, end_date')
      .gte('end_date', today)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching blocked dates:', error)
      return NextResponse.json({ blockedDates: [] })
    }

    return NextResponse.json({ blockedDates: data || [] })
  } catch (error) {
    console.error('Error in blocked-dates API:', error)
    return NextResponse.json({ blockedDates: [] })
  }
}
