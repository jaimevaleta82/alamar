'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1B4D5C] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-2">
            Panel de Administración
          </h1>
          <p className="font-sans text-sm text-[#666666]">
            ALAMAR BEACH HOUSE
          </p>
        </div>

        <div className="bg-white border border-[#E8E3D8] rounded-lg p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@alamarhouse.com"
                required
                className="w-full font-sans text-sm text-[#2C2C2C] bg-white border border-[#E8E3D8] rounded-sm px-4 py-3 outline-none transition-colors placeholder:text-[#888880] focus:border-[#1B4D5C]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-sans text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full font-sans text-sm text-[#2C2C2C] bg-white border border-[#E8E3D8] rounded-sm px-4 py-3 pr-12 outline-none transition-colors placeholder:text-[#888880] focus:border-[#1B4D5C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888880] hover:text-[#2C2C2C] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#D97373]/10 border border-[#D97373]/30 rounded-sm px-4 py-3">
                <p className="font-sans text-sm text-[#D97373]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B4D5C] text-white font-sans font-semibold text-sm px-8 py-4 rounded-sm tracking-wide hover:bg-[#2A6B7E] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-sans text-xs text-[#888880]">
          Acceso restringido solo para administradores autorizados.
        </p>
      </div>
    </div>
  )
}
