-- ============================================
-- DATABASE SETUP FOR PRESENSI SMK HANDAYANI
-- ============================================
-- Jalankan script ini di SQL Editor Supabase
-- ============================================

-- 1. Buat tabel KELAS
CREATE TABLE IF NOT EXISTS kelas (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat tabel SISWA
CREATE TABLE IF NOT EXISTS siswa (
    id SERIAL PRIMARY KEY,
    nis VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    jenis_kelamin VARCHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat tabel ABSENSI
CREATE TABLE IF NOT EXISTS absensi (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha')),
    waktu TIME NOT NULL DEFAULT CURRENT_TIME,
    foto TEXT,
    keterangan TEXT,
    lokasi VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(siswa_id, tanggal)
);

-- 4. Buat tabel SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    logo TEXT,
    copyright TEXT DEFAULT '© 2025 Sistem Presensi Online - SMK Handayani Banjaran',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES untuk performa
-- ============================================
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas);
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_id ON absensi(siswa_id);
CREATE INDEX IF NOT EXISTS idx_absensi_status ON absensi(status);

-- ============================================
-- TRIGGER untuk updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kelas_updated_at
    BEFORE UPDATE ON kelas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at
    BEFORE UPDATE ON siswa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absensi_updated_at
    BEFORE UPDATE ON absensi
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (untuk development)
-- Untuk production, sesuaikan policy sesuai kebutuhan keamanan

CREATE POLICY "Allow all operations on kelas" ON kelas
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on siswa" ON siswa
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on absensi" ON absensi
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SAMPLE DATA (Opsional - hapus jika tidak diperlukan)
-- ============================================

-- Insert contoh kelas
INSERT INTO kelas (nama) VALUES
    ('XII TKJ 1'),
    ('XII TKJ 2'),
    ('XII RPL 1'),
    ('XII RPL 2'),
    ('XI TKJ 1'),
    ('XI TKJ 2'),
    ('XI RPL 1'),
    ('XI RPL 2'),
    ('X TKJ 1'),
    ('X TKJ 2'),
    ('X RPL 1'),
    ('X RPL 2')
ON CONFLICT (nama) DO NOTHING;

-- Insert contoh siswa
INSERT INTO siswa (nis, nama, kelas, jenis_kelamin) VALUES
    ('12345001', 'Ahmad Fauzi', 'XII TKJ 1', 'L'),
    ('12345002', 'Budi Santoso', 'XII TKJ 1', 'L'),
    ('12345003', 'Citra Dewi', 'XII TKJ 1', 'P'),
    ('12345004', 'Dian Permata', 'XII TKJ 1', 'P'),
    ('12345005', 'Eko Prasetyo', 'XII TKJ 1', 'L'),
    ('12345006', 'Fitri Handayani', 'XII RPL 1', 'P'),
    ('12345007', 'Gunawan Wibowo', 'XII RPL 1', 'L'),
    ('12345008', 'Hana Safitri', 'XII RPL 1', 'P'),
    ('12345009', 'Irfan Hakim', 'XII RPL 1', 'L'),
    ('12345010', 'Julia Anggraini', 'XII RPL 1', 'P')
ON CONFLICT (nis) DO NOTHING;

-- Insert default settings
INSERT INTO settings (id, copyright) VALUES
    (1, '© 2025 Sistem Presensi Online - SMK Handayani Banjaran')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SELESAI
-- ============================================
-- Database siap digunakan!
-- Selanjutnya:
-- 1. Copy Project URL dan anon key dari Supabase
-- 2. Tambahkan ke Environment Variables di Vercel
-- ============================================
