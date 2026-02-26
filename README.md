# Sistem Presensi Online - SMK Handayani Banjaran

Aplikasi presensi online dengan fitur upload foto, validasi GPS, dan panel admin lengkap.

## Fitur Utama

### Untuk Siswa (Halaman Utama)
- Form absensi dengan pilihan status (Hadir, Sakit, Izin, Alpha)
- Upload foto bukti untuk semua status (kamera atau file)
- Validasi lokasi GPS untuk absensi Hadir
- Batas waktu absensi (06:00 - 08:00)
- Statistik kehadiran hari ini dengan grafik
- Daftar siswa yang belum absen
- Export data ke Excel dan PDF

### Untuk Admin (Setelah Login)
- Username: `admin` | Password: `admin123`
- Kelola data siswa (tambah, edit, hapus)
- Kelola data kelas (tambah, edit, hapus)
- Kelola data absensi (edit, hapus)
- Kelola pengaturan (logo sekolah, copyright)
- Rekap absensi per kelas dan tanggal

## Teknologi

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

---

## Langkah-Langkah Deploy ke Vercel

### Langkah 1: Buat Akun Supabase

1. Buka https://supabase.com
2. Klik "Start your project" dan daftar (bisa pakai GitHub)
3. Buat organization baru jika belum ada
4. Klik "New Project" dan isi:
   - Name: `presensi-smk`
   - Database Password: (buat password kuat, simpan baik-baik)
   - Region: pilih yang terdekat (Singapore direkomendasikan)
5. Tunggu beberapa menit sampai project selesai dibuat

### Langkah 2: Setup Database Supabase

1. Di dashboard Supabase, klik menu **SQL Editor** di sidebar kiri
2. Klik "New query"
3. Copy seluruh isi file `database.sql` yang ada di folder ini
4. Paste dan klik **Run** (tombol hijau di kanan bawah)
5. Pastikan semua tabel berhasil dibuat

### Langkah 3: Dapatkan Kredensial Supabase

1. Di dashboard Supabase, klik ikon **Settings** (gerigi) di sidebar kiri
2. Klik **API** di menu
3. Copy dan simpan dua nilai berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

### Langkah 4: Upload ke GitHub

1. Buat repository baru di GitHub:
   - Buka https://github.com/new
   - Repository name: `presensi-smk`
   - Pilih **Private** jika tidak ingin publik
   - Klik "Create repository"

2. Di komputer Anda, buka terminal di folder project:
```bash
# Inisialisasi git
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - Presensi SMK"

# Tambahkan remote GitHub (ganti USERNAME dengan username GitHub Anda)
git remote add origin https://github.com/USERNAME/presensi-smk.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

### Langkah 5: Deploy ke Vercel

1. Buka https://vercel.com
2. Klik "Sign Up" dan daftar dengan akun GitHub
3. Setelah login, klik **"Add New..."** → **"Project"**
4. Pilih repository `presensi-smk` dari daftar
5. Klik **Import**

6. Di halaman konfigurasi:
   - Framework Preset: **Next.js** (otomatis terdeteksi)
   - Root Directory: `./` (default)

7. **PENTING - Tambahkan Environment Variables:**
   - Klik tab **Environment Variables**
   - Tambahkan 2 variabel:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

   (Ganti dengan nilai dari Langkah 3)

8. Klik **Deploy**
9. Tunggu 1-2 menit sampai proses selesai
10. Klik **Visit** untuk melihat aplikasi Anda!

---

## Setelah Deploy

### Inisialisasi Data Awal

Buka aplikasi Anda dan lakukan:
1. Klik tombol **Admin** di pojok kanan atas
2. Login dengan:
   - Username: `admin`
   - Password: `admin123`
3. Tambahkan kelas di menu **Kelas**
4. Tambahkan siswa di menu **Siswa**
5. Upload logo sekolah di menu **Pengaturan**

### Mengganti Password Admin

Password admin disimpan di kode. Untuk menggantinya:
1. Buka file `src/app/page.tsx`
2. Cari baris: `if (adminUsername === 'admin' && adminPassword === 'admin123')`
3. Ganti username dan password sesuai keinginan
4. Push kembali ke GitHub (Vercel akan otomatis deploy ulang)

### Mengubah Koordinat Lokasi Sekolah

1. Buka Google Maps dan cari lokasi sekolah Anda
2. Klik kanan pada lokasi tepat, copy koordinat
3. Buka file `src/app/page.tsx`
4. Cari bagian `SCHOOL_CONFIG` dan ubah:
```javascript
const SCHOOL_CONFIG = {
  location: {
    lat: -6.903444,  // Ganti dengan latitude sekolah Anda
    lng: 107.614532, // Ganti dengan longitude sekolah Anda
    radius: 100      // Radius dalam meter
  },
  absenStartTime: '06:00',  // Waktu mulai absen
  absenEndTime: '08:00'     // Waktu selesai absen
}
```

---

## Struktur File

```
presensi-smk-v2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── absensi/route.ts   # API absensi
│   │   │   ├── kelas/route.ts     # API kelas
│   │   │   ├── rekap/route.ts     # API statistik
│   │   │   ├── seed/route.ts      # API inisialisasi
│   │   │   ├── settings/route.ts  # API pengaturan
│   │   │   └── siswa/route.ts     # API siswa
│   │   ├── globals.css            # Style global
│   │   ├── layout.tsx             # Layout utama
│   │   └── page.tsx               # Halaman utama
│   └── lib/
│       └── supabase.ts            # Koneksi database
├── public/
│   ├── logo.svg
│   ├── manifest.json
│   └── robots.txt
├── package.json
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── database.sql                   # Script database
└── README.md                      # Dokumentasi
```

---

## Dukungan

Jika mengalami masalah, pastikan:
1. Environment variables sudah benar di Vercel
2. Database Supabase sudah di-setup dengan script SQL
3. Tidak ada error di build logs Vercel

---

© 2025 Sistem Presensi Online - SMK Handayani Banjaran
