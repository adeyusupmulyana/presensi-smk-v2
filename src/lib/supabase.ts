import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Siswa {
  id: number
  nis: string
  nama: string
  kelas: string
  jenisKelamin: string
  created_at: string
  updated_at: string
}

export interface Absensi {
  id: number
  siswa_id: number
  tanggal: string
  status: string
  waktu: string
  foto: string | null
  keterangan: string | null
  lokasi: string | null
  created_at: string
  updated_at: string
  siswa?: Siswa
}
