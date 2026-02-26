import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Rekap absensi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tanggal = searchParams.get('tanggal')
    const bulan = searchParams.get('bulan')
    const kelas = searchParams.get('kelas')

    // Get all students (filter by kelas)
    let siswaQuery = supabase
      .from('siswa')
      .select('*')
      .order('nama', { ascending: true })

    if (kelas) {
      siswaQuery = siswaQuery.eq('kelas', kelas)
    }

    const { data: siswaData } = await siswaQuery

    const siswa = siswaData?.map(s => ({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      jenisKelamin: s.jenis_kelamin
    })) || []

    const today = new Date().toISOString().split('T')[0]

    // Build filter for absensi
    let absensiQuery = supabase
      .from('absensi')
      .select('*, siswa(*)')

    if (tanggal) {
      absensiQuery = absensiQuery.eq('tanggal', tanggal)
    } else if (bulan) {
      absensiQuery = absensiQuery.gte('tanggal', `${bulan}-01`).lte('tanggal', `${bulan}-31`)
    }

    if (kelas) {
      absensiQuery = absensiQuery.eq('siswa.kelas', kelas)
    }

    const { data: absensiData } = await absensiQuery

    const absensi = absensiData?.map(a => ({
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
    })) || []

    // Statistics
    const stats = {
      totalSiswa: siswa.length,
      hadir: absensi.filter(a => a.status === 'hadir').length,
      sakit: absensi.filter(a => a.status === 'sakit').length,
      izin: absensi.filter(a => a.status === 'izin').length,
      alpha: absensi.filter(a => a.status === 'alpha').length
    }

    // Get students who haven't attended today
    let todayQuery = supabase
      .from('absensi')
      .select('siswa_id, siswa!inner(kelas)')
      .eq('tanggal', tanggal || today)

    if (kelas) {
      todayQuery = todayQuery.eq('siswa.kelas', kelas)
    }

    const { data: todayAbsensiIds } = await todayQuery
    const siswaIdsWithAbsensi = new Set(todayAbsensiIds?.map(a => a.siswa_id) || [])
    const belumAbsen = siswa.filter(s => !siswaIdsWithAbsensi.has(s.id))

    // Get today's absensi with details
    let todayDetailQuery = supabase
      .from('absensi')
      .select('*, siswa(*)')
      .eq('tanggal', today)

    if (kelas) {
      todayDetailQuery = todayDetailQuery.eq('siswa.kelas', kelas)
    }

    const { data: todayAbsensiData } = await todayDetailQuery

    const todayAbsensi = todayAbsensiData?.map(a => ({
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
    })) || []

    const todayStats = {
      hadir: todayAbsensi.filter(a => a.status === 'hadir'),
      sakit: todayAbsensi.filter(a => a.status === 'sakit'),
      izin: todayAbsensi.filter(a => a.status === 'izin'),
      alpha: todayAbsensi.filter(a => a.status === 'alpha')
    }

    return NextResponse.json({
      tanggal: tanggal || today,
      stats,
      todayStats,
      belumAbsen,
      absensi
    })
  } catch (error) {
    console.error('Error fetching rekap:', error)
    return NextResponse.json({ error: 'Gagal mengambil rekap absensi' }, { status: 500 })
  }
}
