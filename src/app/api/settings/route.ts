import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Ambil pengaturan
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || { id: 1, logo: null, copyright: '© 2025 Sistem Presensi Online - SMK Handayani Banjaran' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
  }
}

// POST - Simpan pengaturan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logo, copyright } = body

    // Check if settings exists
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 1)
      .single()

    let data, error
    
    if (existing) {
      // Update
      const result = await supabase
        .from('settings')
        .update({ logo, copyright })
        .eq('id', 1)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert
      const result = await supabase
        .from('settings')
        .insert([{ id: 1, logo, copyright }])
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}
