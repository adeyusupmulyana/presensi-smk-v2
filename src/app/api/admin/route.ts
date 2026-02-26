import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Login admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    return NextResponse.json({ success: true, username: data.username })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 })
  }
}
