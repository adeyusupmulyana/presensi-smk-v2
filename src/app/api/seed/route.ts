import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Seed data siswa dummy untuk semua kelas
export async function POST() {
  try {
    const { count } = await supabase
      .from('siswa')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json({ message: 'Data siswa sudah ada', count })
    }

    // Data untuk semua kelas
    const siswaData = [
      // XII TKJ 1
      { nis: '2024001', nama: 'Ahmad Rizki', kelas: 'XII TKJ 1', jenis_kelamin: 'L' },
      { nis: '2024002', nama: 'Siti Nurhaliza', kelas: 'XII TKJ 1', jenis_kelamin: 'P' },
      { nis: '2024003', nama: 'Budi Santoso', kelas: 'XII TKJ 1', jenis_kelamin: 'L' },
      { nis: '2024004', nama: 'Dewi Lestari', kelas: 'XII TKJ 1', jenis_kelamin: 'P' },
      { nis: '2024005', nama: 'Eko Prasetyo', kelas: 'XII TKJ 1', jenis_kelamin: 'L' },
      { nis: '2024006', nama: 'Fitri Handayani', kelas: 'XII TKJ 1', jenis_kelamin: 'P' },
      { nis: '2024007', nama: 'Gunawan Wibowo', kelas: 'XII TKJ 1', jenis_kelamin: 'L' },
      { nis: '2024008', nama: 'Hana Putri', kelas: 'XII TKJ 1', jenis_kelamin: 'P' },
      { nis: '2024009', nama: 'Irfan Maulana', kelas: 'XII TKJ 1', jenis_kelamin: 'L' },
      { nis: '2024010', nama: 'Julia Anggraini', kelas: 'XII TKJ 1', jenis_kelamin: 'P' },
      // XII TKJ 2
      { nis: '2024011', nama: 'Kevin Aditya', kelas: 'XII TKJ 2', jenis_kelamin: 'L' },
      { nis: '2024012', nama: 'Linda Sari', kelas: 'XII TKJ 2', jenis_kelamin: 'P' },
      { nis: '2024013', nama: 'Muhammad Farhan', kelas: 'XII TKJ 2', jenis_kelamin: 'L' },
      { nis: '2024014', nama: 'Nadia Permata', kelas: 'XII TKJ 2', jenis_kelamin: 'P' },
      { nis: '2024015', nama: 'Oki Setiawan', kelas: 'XII TKJ 2', jenis_kelamin: 'L' },
      { nis: '2024016', nama: 'Putri Rahayu', kelas: 'XII TKJ 2', jenis_kelamin: 'P' },
      { nis: '2024017', nama: 'Rizal Firmansyah', kelas: 'XII TKJ 2', jenis_kelamin: 'L' },
      { nis: '2024018', nama: 'Sinta Dewi', kelas: 'XII TKJ 2', jenis_kelamin: 'P' },
      { nis: '2024019', nama: 'Toni Wijaya', kelas: 'XII TKJ 2', jenis_kelamin: 'L' },
      { nis: '2024020', nama: 'Umi Kalsum', kelas: 'XII TKJ 2', jenis_kelamin: 'P' },
      // XII RPL 1
      { nis: '2024021', nama: 'Vina Oktaviani', kelas: 'XII RPL 1', jenis_kelamin: 'P' },
      { nis: '2024022', nama: 'Wahyu Hidayat', kelas: 'XII RPL 1', jenis_kelamin: 'L' },
      { nis: '2024023', nama: 'Xavier Putra', kelas: 'XII RPL 1', jenis_kelamin: 'L' },
      { nis: '2024024', nama: 'Yuliana Sari', kelas: 'XII RPL 1', jenis_kelamin: 'P' },
      { nis: '2024025', nama: 'Zaki Rahman', kelas: 'XII RPL 1', jenis_kelamin: 'L' },
      { nis: '2024026', nama: 'Anisa Putri', kelas: 'XII RPL 1', jenis_kelamin: 'P' },
      { nis: '2024027', nama: 'Bayu Pratama', kelas: 'XII RPL 1', jenis_kelamin: 'L' },
      { nis: '2024028', nama: 'Citra Dewi', kelas: 'XII RPL 1', jenis_kelamin: 'P' },
      { nis: '2024029', nama: 'Dani Setiawan', kelas: 'XII RPL 1', jenis_kelamin: 'L' },
      { nis: '2024030', nama: 'Eva Susanti', kelas: 'XII RPL 1', jenis_kelamin: 'P' }
    ]

    const { data, error } = await supabase
      .from('siswa')
      .insert(siswaData)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Data siswa berhasil ditambahkan', 
      count: data?.length || 0 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah data siswa' }, { status: 500 })
  }
}
