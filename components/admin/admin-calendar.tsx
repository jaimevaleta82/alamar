'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Lock, Unlock } from 'lucide-react'

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
  calendarBlocks: CalendarBlock[]
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

export default function AdminCalendar({ calendarBlocks }: Props) {
  const router = useRouter()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockNote, setBlockNote] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Create a map of dates to their blocks
  const blockedMap = useMemo(() => {
    const map = new Map<string, CalendarBlock>()
    calendarBlocks.forEach(block => {
      const start = parseDate(block.start_date)
      const end = parseDate(block.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        map.set(formatDate(d), block)
      }
    })
    return map
  }, [calendarBlocks])

  function isDateBlocked(dateStr: string): CalendarBlock | undefined {
    return blockedMap.get(dateStr)
  }

  function isDatePast(dateStr: string): boolean {
    const date = parseDate(dateStr)
    return date < today
  }

  function isInSelection(dateStr: string): boolean {
    if (!selectedStart) return false
    if (!selectedEnd) return dateStr === selectedStart
    const date = parseDate(dateStr)
    const start = parseDate(selectedStart)
    const end = parseDate(selectedEnd)
    return date >= start && date <= end
  }

  function handleDateClick(dateStr: string) {
    if (isDatePast(dateStr)) return

    const block = isDateBlocked(dateStr)
    if (block) {
      // If clicking on a blocked date, select it for potential deletion
      setSelectedStart(block.start_date)
      setSelectedEnd(block.end_date)
      return
    }

    if (!selectedStart) {
      setSelectedStart(dateStr)
      setSelectedEnd(null)
    } else if (!selectedEnd) {
      if (dateStr < selectedStart) {
        setSelectedStart(dateStr)
      } else {
        // Check if range contains blocked dates
        const start = parseDate(selectedStart)
        const end = parseDate(dateStr)
        let hasBlocked = false
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (isDateBlocked(formatDate(d))) {
            hasBlocked = true
            break
          }
        }
        if (hasBlocked) {
          setSelectedStart(dateStr)
          setSelectedEnd(null)
        } else {
          setSelectedEnd(dateStr)
        }
      }
    } else {
      setSelectedStart(dateStr)
      setSelectedEnd(null)
    }
  }

  function clearSelection() {
    setSelectedStart(null)
    setSelectedEnd(null)
  }

  async function handleCreateBlock() {
    if (!selectedStart || !selectedEnd) return
    setIsCreating(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('calendar_blocks').insert({
        start_date: selectedStart,
        end_date: selectedEnd,
        note: blockNote || null,
        source: 'manual',
      })

      if (error) {
        console.error('Error creating block:', error)
        return
      }

      setShowBlockModal(false)
      setBlockNote('')
      clearSelection()
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteBlock(blockId: string) {
    setIsDeleting(blockId)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', blockId)

      if (error) {
        console.error('Error deleting block:', error)
        return
      }

      clearSelection()
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsDeleting(null)
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

  // Get block for selection
  const selectedBlock = selectedStart ? isDateBlocked(selectedStart) : undefined

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-[#E0E7FF]/30 border border-[#E0E7FF] rounded-lg p-4">
        <h3 className="font-sans text-sm font-semibold text-[#4F46E5] mb-2">
          Instrucciones
        </h3>
        <ul className="font-sans text-sm text-[#4F46E5]/80 space-y-1">
          <li>• Haz clic en una fecha para iniciar la selección</li>
          <li>• Haz clic en otra fecha para completar el rango</li>
          <li>• Usa el botón &quot;Bloquear fechas&quot; para confirmar</li>
          <li>• Haz clic en una fecha bloqueada para ver opciones de eliminar</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5F3EE] transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} className="text-[#2C2C2C]" />
            </button>
            <span className="font-serif text-xl font-semibold text-[#2C2C2C]">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5F3EE] transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} className="text-[#2C2C2C]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center font-sans text-xs font-semibold text-[#888880] py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-12" />
              }
              
              const dateStr = formatDate(new Date(currentYear, currentMonth, day))
              const block = isDateBlocked(dateStr)
              const isPast = isDatePast(dateStr)
              const isSelected = isInSelection(dateStr)
              const isStart = dateStr === selectedStart
              const isEnd = dateStr === selectedEnd

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  disabled={isPast}
                  className={`
                    h-12 rounded-sm font-sans text-sm transition-all duration-200 relative
                    ${isSelected && !block
                      ? 'bg-[#1B4D5C] text-white font-semibold'
                      : block
                        ? block.source === 'booking'
                          ? 'bg-[#7BA696] text-white'
                          : 'bg-[#D97373]/30 text-[#D97373]'
                        : isPast
                          ? 'text-[#CCCCCC] cursor-not-allowed'
                          : 'text-[#2C2C2C] hover:bg-[#E8E3D8]'
                    }
                    ${isStart && selectedEnd ? 'rounded-l-lg rounded-r-none' : ''}
                    ${isEnd ? 'rounded-r-lg rounded-l-none' : ''}
                    ${isSelected && !isStart && !isEnd && selectedEnd ? 'rounded-none' : ''}
                  `}
                >
                  {day}
                  {block && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-[#E8E3D8]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-[#D97373]/30" />
              <span className="font-sans text-xs text-[#666666]">Bloqueado manual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-[#7BA696]" />
              <span className="font-sans text-xs text-[#666666]">Reserva confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm bg-[#1B4D5C]" />
              <span className="font-sans text-xs text-[#666666]">Selección</span>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          {/* Selection Info */}
          <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
            <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4">
              {selectedBlock ? 'Bloqueo seleccionado' : 'Selección actual'}
            </h3>
            
            {selectedStart ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-[#E8E3D8]">
                  <span className="font-sans text-sm text-[#666666]">Inicio</span>
                  <span className="font-sans text-sm font-medium text-[#2C2C2C]">
                    {parseDate(selectedStart).toLocaleDateString('es-CO', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E8E3D8]">
                  <span className="font-sans text-sm text-[#666666]">Fin</span>
                  <span className="font-sans text-sm font-medium text-[#2C2C2C]">
                    {selectedEnd 
                      ? parseDate(selectedEnd).toLocaleDateString('es-CO', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })
                      : '—'
                    }
                  </span>
                </div>
                
                {selectedBlock && (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-[#E8E3D8]">
                      <span className="font-sans text-sm text-[#666666]">Tipo</span>
                      <span className={`font-sans text-sm font-medium ${
                        selectedBlock.source === 'booking' ? 'text-[#7BA696]' : 'text-[#D97373]'
                      }`}>
                        {selectedBlock.source === 'booking' ? 'Reserva' : 'Manual'}
                      </span>
                    </div>
                    {selectedBlock.note && (
                      <div className="py-2">
                        <span className="font-sans text-sm text-[#666666] block mb-1">Nota</span>
                        <span className="font-sans text-sm text-[#2C2C2C]">{selectedBlock.note}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  {selectedBlock ? (
                    selectedBlock.source === 'manual' && (
                      <button
                        onClick={() => handleDeleteBlock(selectedBlock.id)}
                        disabled={isDeleting === selectedBlock.id}
                        className="w-full flex items-center justify-center gap-2 bg-[#D97373] text-white font-sans font-semibold text-sm px-4 py-3 rounded-sm hover:bg-[#C25656] transition-colors disabled:opacity-60"
                      >
                        {isDeleting === selectedBlock.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Unlock size={18} />
                            Desbloquear fechas
                          </>
                        )}
                      </button>
                    )
                  ) : selectedEnd ? (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-[#1B4D5C] text-white font-sans font-semibold text-sm px-4 py-3 rounded-sm hover:bg-[#2A6B7E] transition-colors"
                    >
                      <Lock size={18} />
                      Bloquear fechas
                    </button>
                  ) : (
                    <p className="font-sans text-sm text-[#888880] text-center">
                      Selecciona una fecha de fin
                    </p>
                  )}
                  
                  <button
                    onClick={clearSelection}
                    className="w-full font-sans text-sm text-[#666666] hover:text-[#2C2C2C] py-2 transition-colors"
                  >
                    Limpiar selección
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-sans text-sm text-[#888880] text-center py-4">
                Selecciona fechas en el calendario
              </p>
            )}
          </div>

          {/* Current Blocks List */}
          <div className="bg-white border border-[#E8E3D8] rounded-lg p-6">
            <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4">
              Bloqueos activos
            </h3>
            {calendarBlocks.length === 0 ? (
              <p className="font-sans text-sm text-[#888880] text-center py-4">
                No hay bloqueos activos
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {calendarBlocks.map(block => (
                  <div 
                    key={block.id} 
                    className={`flex items-center justify-between p-3 rounded-sm ${
                      block.source === 'booking' ? 'bg-[#7BA696]/10' : 'bg-[#D97373]/10'
                    }`}
                  >
                    <div>
                      <p className="font-sans text-sm font-medium text-[#2C2C2C]">
                        {parseDate(block.start_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        {' — '}
                        {parseDate(block.end_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </p>
                      {block.note && (
                        <p className="font-sans text-xs text-[#666666]">{block.note}</p>
                      )}
                    </div>
                    {block.source === 'manual' && (
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        disabled={isDeleting === block.id}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#D97373]/20 text-[#D97373] transition-colors disabled:opacity-50"
                      >
                        {isDeleting === block.id ? (
                          <div className="w-4 h-4 border-2 border-[#D97373] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-semibold text-[#2C2C2C]">
                Bloquear fechas
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E8E3D8] text-[#666666] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#F5F3EE] rounded-sm p-4">
                <p className="font-sans text-sm text-[#666666]">
                  Vas a bloquear desde{' '}
                  <span className="font-semibold text-[#2C2C2C]">
                    {selectedStart && parseDate(selectedStart).toLocaleDateString('es-CO', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                  {' '}hasta{' '}
                  <span className="font-semibold text-[#2C2C2C]">
                    {selectedEnd && parseDate(selectedEnd).toLocaleDateString('es-CO', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="blockNote" className="font-sans text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                  Nota (opcional)
                </label>
                <input
                  id="blockNote"
                  type="text"
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  placeholder="Ej: Mantenimiento, evento privado..."
                  className="w-full font-sans text-sm text-[#2C2C2C] bg-white border border-[#E8E3D8] rounded-sm px-4 py-3 outline-none transition-colors placeholder:text-[#888880] focus:border-[#1B4D5C]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 font-sans text-sm text-[#666666] border border-[#E8E3D8] px-4 py-3 rounded-sm hover:bg-[#F5F3EE] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBlock}
                disabled={isCreating}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1B4D5C] text-white font-sans font-semibold text-sm px-4 py-3 rounded-sm hover:bg-[#2A6B7E] transition-colors disabled:opacity-60"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={18} />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
