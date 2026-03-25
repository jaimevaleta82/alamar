import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, phone, checkIn, checkOut, guests, message } = body

    // Validate required fields
    if (!fullName || !email || !phone || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      )
    }

    // Validate dates
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: 'La fecha de salida debe ser posterior a la fecha de llegada.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check for conflicting bookings
    const { data: conflicts } = await supabase
      .from('calendar_blocks')
      .select('id')
      .or(`and(start_date.lte.${checkOut},end_date.gte.${checkIn})`)
      .limit(1)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Las fechas seleccionadas no están disponibles. Por favor, selecciona otras fechas.' },
        { status: 409 }
      )
    }

    // Create booking request
    const { data, error } = await supabase
      .from('booking_requests')
      .insert({
        full_name: fullName,
        email,
        phone,
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests),
        message: message || null,
        status: 'pending'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating booking request:', error)
      return NextResponse.json(
        { error: 'Error al crear la solicitud. Por favor, inténtalo de nuevo.' },
        { status: 500 }
      )
    }

    // Build WhatsApp message
    const checkInDate = new Date(checkIn + 'T12:00:00').toLocaleDateString('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    const checkOutDate = new Date(checkOut + 'T12:00:00').toLocaleDateString('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    
    const whatsappMessage = encodeURIComponent(
      `Hola! Quiero reservar ALAMAR BEACH HOUSE:\n\n` +
      `Nombre: ${fullName}\n` +
      `Email: ${email}\n` +
      `Teléfono: ${phone}\n` +
      `Check-in: ${checkInDate}\n` +
      `Check-out: ${checkOutDate}\n` +
      `Huéspedes: ${guests}\n` +
      (message ? `Mensaje: ${message}\n` : '') +
      `\nID de solicitud: ${data.id}`
    )

    // WhatsApp number - replace with actual number
    const whatsappNumber = '573001234567' // Replace with actual WhatsApp number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

    return NextResponse.json({
      success: true,
      requestId: data.id,
      whatsappUrl
    })
  } catch (error) {
    console.error('Error in booking request:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
