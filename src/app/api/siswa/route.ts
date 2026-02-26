import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Ambil semua siswa (dengan filter kelas)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kelas = searchParams.get('kelas')

    let query = supabase
      .from('siswa')
      .select(`*, absensi(count)`)
      .order('nama', { ascending: true })

    if (kelas) {
      query = query.eq('kelas', kelas)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const siswa = data?.map(s => ({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      jenisKelamin: s.jenis_kelamin,
      _count: { absensi: s.absensi?.[0]?.count || 0 }
    })) || []

    return NextResponse.json(siswa)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data siswa' }, { status: 500 })
  }
}

// POST - Tambah siswa baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nis, nama, kelas, jenisKelamin } = body

    if (!nis || !nama || !kelas || !jenisKelamin) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('siswa')
      .insert([{ nis, nama, kelas, jenis_kelamin: jenisKelamin }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'NIS sudah terdaftar' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ...data, jenisKelamin: data.jenis_kelamin }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah siswa' }, { status: 500 })
  }
}

// PUT - Update siswa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nis, nama, kelas, jenisKelamin } = body

    if (!id || !nis || !nama || !kelas || !jenisKelamin) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('siswa')
      .update({ nis, nama, kelas, jenis_kelamin: jenisKelamin })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'NIS sudah terdaftar' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ...data, jenisKelamin: data.jenis_kelamin })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate siswa' }, { status: 500 })
  }
}

// DELETE - Hapus siswa
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID siswa diperlukan' }, { status: 400 })
    }

    const { error } = await supabase
      .from('siswa')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Siswa berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus siswa' }, { status: 500 })
  }
}
