import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function transformAbsensi(a: any) {
  return {
    id: a.id,
    siswaId: a.siswa_id,
    tanggal: a.tanggal,
    status: a.status,
    waktu: a.waktu,
    foto: a.foto,
    keterangan: a.keterangan,
    lokasi: a.lokasi,
    siswa: a.siswa ? {
      id: a.siswa.id,
      nis: a.siswa.nis,
      nama: a.siswa.nama,
      kelas: a.siswa.kelas,
      jenisKelamin: a.siswa.jenis_kelamin
    } : null
  }
}

// GET - Ambil absensi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tanggal = searchParams.get('tanggal')
    const siswaId = searchParams.get('siswaId')
    const kelas = searchParams.get('kelas')

    let query = supabase
      .from('absensi')
      .select('*, siswa(*)')
      .order('tanggal', { ascending: false })
      .order('waktu', { ascending: false })

    if (tanggal) query = query.eq('tanggal', tanggal)
    if (siswaId) query = query.eq('siswa_id', parseInt(siswaId))
    if (kelas) query = query.eq('siswa.kelas', kelas)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.map(transformAbsensi) || [])
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data absensi' }, { status: 500 })
  }
}

// POST - Tambah absensi baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siswaId, status, foto, keterangan, lokasi } = body

    if (!siswaId || !status) {
      return NextResponse.json({ error: 'Siswa dan status harus diisi' }, { status: 400 })
    }

    const today = new Date()
    const tanggal = today.toISOString().split('T')[0]
    const waktu = today.toTimeString().split(' ')[0]

    // Check if already attended
    const { data: existing } = await supabase
      .from('absensi')
      .select('id')
      .eq('siswa_id', parseInt(siswaId))
      .eq('tanggal', tanggal)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Siswa sudah absen hari ini' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('absensi')
      .insert([{
        siswa_id: parseInt(siswaId),
        tanggal,
        status,
        waktu,
        foto: foto || null,
        keterangan: keterangan || null,
        lokasi: lokasi || null
      }])
      .select('*, siswa(*)')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Siswa sudah absen hari ini' }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(transformAbsensi(data), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan absensi' }, { status: 500 })
  }
}

// PUT - Update absensi
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, keterangan } = body

    if (!id) {
      return NextResponse.json({ error: 'ID absensi diperlukan' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('absensi')
      .update({ status, keterangan })
      .eq('id', parseInt(id))
      .select('*, siswa(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(transformAbsensi(data))
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengupdate absensi' }, { status: 500 })
  }
}

// DELETE - Hapus absensi
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID absensi diperlukan' }, { status: 400 })
    }

    const { error } = await supabase
      .from('absensi')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Absensi berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus absensi' }, { status: 500 })
  }
}
