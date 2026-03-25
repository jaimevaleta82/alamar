'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BlockedDate {
  start_date: string
  end_date: string
}

interface Props {
  selectedCheckIn: string
  selectedCheckOut: string
  onSelectCheckIn: (date: string) => void
  onSelectCheckOut: (date: string) => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(str: string): Date {
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function AvailabilityCalendar({
  selectedCheckIn,
  selectedCheckOut,
  onSelectCheckIn,
  onSelectCheckOut,
}: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)

  useEffect(() => {
    async function fetchBlockedDates() {
      try {
        const res = await fetch('/api/calendar/blocked-dates')
        if (res.ok) {
          const data = await res.json()
          setBlockedDates(data.blockedDates || [])
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlockedDates()
  }, [])

  const blockedSet = useMemo(() => {
    const set = new Set<string>()
    blockedDates.forEach(block => {
      const start = parseDate(block.start_date)
      const end = parseDate(block.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(formatDate(d))
      }
    })
    return set
  }, [blockedDates])

  function isDateBlocked(dateStr: string): boolean {
    return blockedSet.has(dateStr)
  }

  function isDatePast(dateStr: string): boolean {
    const date = parseDate(dateStr)
    return date < today
  }

  function isDateInRange(dateStr: string): boolean {
    if (!selectedCheckIn || !selectedCheckOut) return false
    const date = parseDate(dateStr)
    const checkIn = parseDate(selectedCheckIn)
    const checkOut = parseDate(selectedCheckOut)
    return date > checkIn && date < checkOut
  }

  function handleDateClick(dateStr: string) {
    if (isDateBlocked(dateStr) || isDatePast(dateStr)) return

    if (!selectingCheckOut || !selectedCheckIn) {
      onSelectCheckIn(dateStr)
      onSelectCheckOut('')
      setSelectingCheckOut(true)
    } else {
      if (dateStr <= selectedCheckIn) {
        onSelectCheckIn(dateStr)
        onSelectCheckOut('')
      } else {
        // Check if range has blocked dates
        const start = parseDate(selectedCheckIn)
        const end = parseDate(dateStr)
        let hasBlocked = false
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (isDateBlocked(formatDate(d))) {
            hasBlocked = true
            break
          }
        }
        if (hasBlocked) {
          onSelectCheckIn(dateStr)
          onSelectCheckOut('')
        } else {
          onSelectCheckOut(dateStr)
          setSelectingCheckOut(false)
        }
      }
    }
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth())

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [daysInMonth, firstDay])

  return (
    <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-lg font-semibold text-[#2C2C2C]">
          Disponibilidad
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-4">
            <span className="w-3 h-3 rounded-sm bg-[#7BA696]" />
            <span className="font-sans text-xs text-[#666666]">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D97373]/30" />
            <span className="font-sans text-xs text-[#666666]">No disponible</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#1B4D5C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} className="text-[#2C2C2C]" />
            </button>
            <span className="font-sans font-semibold text-[#2C2C2C]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3EE] transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} className="text-[#2C2C2C]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center font-sans text-xs font-medium text-[#888880] py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-10" />
              }
              
              const dateStr = formatDate(new Date(currentYear, currentMonth, day))
              const isBlocked = isDateBlocked(dateStr)
              const isPast = isDatePast(dateStr)
              const isCheckIn = dateStr === selectedCheckIn
              const isCheckOut = dateStr === selectedCheckOut
              const isInRange = isDateInRange(dateStr)
              const isDisabled = isBlocked || isPast

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  disabled={isDisabled}
                  className={`
                    h-10 rounded-sm font-sans text-sm transition-all duration-200
                    ${isCheckIn || isCheckOut
                      ? 'bg-[#1B4D5C] text-white font-semibold'
                      : isInRange
                        ? 'bg-[#1B4D5C]/10 text-[#1B4D5C]'
                        : isBlocked
                          ? 'bg-[#D97373]/20 text-[#D97373]/60 cursor-not-allowed line-through'
                          : isPast
                            ? 'text-[#CCCCCC] cursor-not-allowed'
                            : 'text-[#2C2C2C] hover:bg-[#7BA696]/20 hover:text-[#1B4D5C]'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {(selectedCheckIn || selectedCheckOut) && (
            <div className="mt-4 pt-4 border-t border-[#E8E3D8]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-sans text-xs text-[#888880]">Check-in</span>
                  <p className="font-sans text-sm font-medium text-[#2C2C2C]">
                    {selectedCheckIn ? new Date(selectedCheckIn + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#CCCCCC]" />
                <div className="text-right">
                  <span className="font-sans text-xs text-[#888880]">Check-out</span>
                  <p className="font-sans text-sm font-medium text-[#2C2C2C]">
                    {selectedCheckOut ? new Date(selectedCheckOut + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
