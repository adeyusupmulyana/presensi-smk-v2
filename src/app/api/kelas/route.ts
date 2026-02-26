import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Ambil semua kelas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('kelas')
      .select('*')
      .order('nama', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data kelas' }, { status: 500 })
  }
}

// POST - Tambah kelas baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama } = body

    if (!nama) {
      return NextResponse.json({ error: 'Nama kelas harus diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kelas')
      .insert([{ nama }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah kelas' }, { status: 500 })
  }
}

// PUT - Update kelas
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nama } = body

    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan nama kelas harus diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('kelas')
      .update({ nama })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate kelas' }, { status: 500 })
  }
}

// DELETE - Hapus kelas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID kelas diperlukan' }, { status: 400 })
    }

    const { error } = await supabase
      .from('kelas')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Kelas berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus kelas' }, { status: 500 })
  }
}
