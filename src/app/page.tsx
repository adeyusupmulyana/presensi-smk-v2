'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Types
interface Siswa {
  id: number
  nis: string
  nama: string
  kelas: string
  jenisKelamin: string
  _count?: { absensi: number }
}

interface Kelas {
  id: number
  nama: string
}

interface Absensi {
  id: number
  siswaId: number
  tanggal: string
  status: string
  waktu: string
  foto: string | null
  keterangan: string | null
  lokasi: string | null
  siswa: Siswa
}

interface Settings {
  id: number
  logo: string | null
  copyright: string
}

interface TodayStats {
  hadir: Absensi[]
  sakit: Absensi[]
  izin: Absensi[]
  alpha: Absensi[]
}

interface MonthlyStats {
  bulan: string
  hadir: number
  sakit: number
  izin: number
  alpha: number
  total: number
}

// Default Settings
const DEFAULT_SETTINGS: Settings = {
  id: 1,
  logo: null,
  copyright: '© 2025 Sistem Presensi Online - SMK Handayani Banjaran'
}

// School Location Settings
const SCHOOL_CONFIG = {
  location: {
    lat: -6.903444,
    lng: 107.614532,
    radius: 100
  },
  absenStartTime: '06:00',
  absenEndTime: '08:00'
}

export default function Home() {
  // State - Data
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [todayAbsensi, setTodayAbsensi] = useState<Absensi[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({ hadir: [], sakit: [], izin: [], alpha: [] })
  const [belumAbsen, setBelumAbsen] = useState<Siswa[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  
  // State - UI
  const [activeTab, setActiveTab] = useState<'absensi' | 'admin'>('absensi')
  const [adminTab, setAdminTab] = useState<'siswa' | 'kelas' | 'absensi' | 'pengaturan'>('siswa')
  const [darkMode, setDarkMode] = useState(false)
  
  // State - Filter
  const [selectedKelas, setSelectedKelas] = useState<string>('')
  const [filterTanggal, setFilterTanggal] = useState<string>(new Date().toISOString().split('T')[0])
  const [filterBulan, setFilterBulan] = useState<string>(new Date().toISOString().slice(0, 7))
  
  // State - Form Absensi
  const [selectedSiswa, setSelectedSiswa] = useState<string>('')
  const [status, setStatus] = useState<string>('hadir')
  const [keterangan, setKeterangan] = useState<string>('')
  const [foto, setFoto] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [locationValid, setLocationValid] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)
  
  // State - Camera
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // State - Admin Login
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  
  // State - Admin Forms
  const [showSiswaModal, setShowSiswaModal] = useState(false)
  const [showKelasModal, setShowKelasModal] = useState(false)
  const [showAbsensiModal, setShowAbsensiModal] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null)
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null)
  const [editingAbsensi, setEditingAbsensi] = useState<Absensi | null>(null)
  
  // State - Form Siswa
  const [formNis, setFormNis] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formKelas, setFormKelas] = useState('')
  const [formJk, setFormJk] = useState('L')
  
  // State - Form Kelas
  const [formNamaKelas, setFormNamaKelas] = useState('')
  
  // State - Form Pengaturan
  const [formCopyright, setFormCopyright] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Current date & time
  const today = new Date()
  const formattedDate = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const currentTime = today.toTimeString().slice(0, 5)
  
  // Helper Functions
  const isWithinAllowedTime = () => {
    const now = currentTime
    return now >= SCHOOL_CONFIG.absenStartTime && now <= SCHOOL_CONFIG.absenEndTime
  }
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const distance = calculateDistance(latitude, longitude, SCHOOL_CONFIG.location.lat, SCHOOL_CONFIG.location.lng)
          const isValid = distance <= SCHOOL_CONFIG.location.radius
          setLocationValid(isValid)
          setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${Math.round(distance)}m dari sekolah)`)
          if (!isValid) {
            setMessage({ type: 'warning', text: `Anda berada ${Math.round(distance)}m dari sekolah.` })
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setMessage({ type: 'error', text: 'Tidak dapat mengakses lokasi GPS' })
          setLocationValid(false)
        }
      )
    }
  }
  
  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  
  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch kelas
      const kelasRes = await fetch('/api/kelas')
      const kelasData = await kelasRes.json()
      setKelasList(kelasData)
      if (kelasData.length > 0 && !selectedKelas) {
        setSelectedKelas(kelasData[0].nama)
      }
      
      // Fetch settings
      try {
        const settingsRes = await fetch('/api/settings')
        const settingsData = await settingsRes.json()
        if (settingsData) {
          setSettings(settingsData)
          setFormCopyright(settingsData.copyright || '')
        }
      } catch (e) {
        console.log('Settings not found, using defaults')
      }
      
      // Fetch siswa
      const kelasFilter = selectedKelas || (kelasData.length > 0 ? kelasData[0].nama : '')
      if (kelasFilter) {
        const siswaRes = await fetch(`/api/siswa?kelas=${kelasFilter}`)
        const siswaData = await siswaRes.json()
        setSiswa(siswaData)
        
        // Fetch today's data
        const rekapRes = await fetch(`/api/rekap?tanggal=${filterTanggal}&kelas=${kelasFilter}`)
        const rekapData = await rekapRes.json()
        setTodayStats(rekapData.todayStats || { hadir: [], sakit: [], izin: [], alpha: [] })
        setBelumAbsen(rekapData.belumAbsen || [])
        
        const absensiRes = await fetch(`/api/absensi?tanggal=${filterTanggal}&kelas=${kelasFilter}`)
        const absensiData = await absensiRes.json()
        setTodayAbsensi(absensiData)
        
        const monthlyRes = await fetch(`/api/rekap?bulan=${filterBulan}&kelas=${kelasFilter}`)
        const monthlyData = await monthlyRes.json()
        processMonthlyStats(monthlyData.absensi || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedKelas, filterTanggal, filterBulan])
  
  const processMonthlyStats = (absensiData: Absensi[]) => {
    const stats: { [key: string]: MonthlyStats } = {}
    absensiData.forEach(a => {
      const bulan = a.tanggal.slice(0, 7)
      if (!stats[bulan]) {
        stats[bulan] = { bulan, hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 }
      }
      stats[bulan][a.status as keyof MonthlyStats]++
      stats[bulan].total++
    })
    setMonthlyStats(Object.values(stats).sort((a, b) => b.bulan.localeCompare(a.bulan)))
  }

  useEffect(() => {
    fetchData()
    getCurrentLocation()
  }, [fetchData])

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setFoto(base64)
        setFotoPreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      setMessage({ type: 'error', text: 'Tidak dapat mengakses kamera' })
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg', 0.8)
        setFoto(base64)
        setFotoPreview(base64)
        stopCamera()
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  // Submit Absensi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSiswa) {
      setMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu' })
      return
    }
    if (status === 'hadir' && !isWithinAllowedTime()) {
      setMessage({ type: 'error', text: `Absen Hadir hanya bisa dilakukan jam ${SCHOOL_CONFIG.absenStartTime} - ${SCHOOL_CONFIG.absenEndTime}` })
      return
    }
    if (status === 'hadir' && locationValid === false) {
      setMessage({ type: 'error', text: 'Anda harus berada di lokasi sekolah untuk absen Hadir' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswaId: parseInt(selectedSiswa), status, foto, keterangan, lokasi: currentLocation })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan absensi')
      setMessage({ type: 'success', text: `Absensi ${data.siswa?.nama || 'siswa'} berhasil disimpan!` })
      setSelectedSiswa('')
      setStatus('hadir')
      setKeterangan('')
      setFoto(null)
      setFotoPreview(null)
      fetchData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsLoggedIn(true)
        setShowLoginModal(false)
        setMessage({ type: 'success', text: 'Login Admin berhasil!' })
        setActiveTab('admin')
        setAdminPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Username atau password salah!' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal login. Coba lagi.' })
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setActiveTab('absensi')
    setMessage({ type: 'success', text: 'Berhasil logout!' })
  }

  // CRUD Siswa
  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingSiswa ? 'PUT' : 'POST'
      const body = editingSiswa 
        ? { id: editingSiswa.id, nis: formNis, nama: formNama, kelas: formKelas, jenisKelamin: formJk }
        : { nis: formNis, nama: formNama, kelas: formKelas, jenisKelamin: formJk }
      
      const res = await fetch('/api/siswa', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Gagal menyimpan siswa')
      
      setShowSiswaModal(false)
      setEditingSiswa(null)
      resetSiswaForm()
      fetchData()
      setMessage({ type: 'success', text: 'Siswa berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan siswa' })
    }
  }

  const handleDeleteSiswa = async (id: number) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return
    try {
      const res = await fetch(`/api/siswa?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      fetchData()
      setMessage({ type: 'success', text: 'Siswa berhasil dihapus!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus siswa' })
    }
  }

  const resetSiswaForm = () => {
    setFormNis('')
    setFormNama('')
    setFormKelas('')
    setFormJk('L')
  }

  // CRUD Kelas
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingKelas ? 'PUT' : 'POST'
      const body = editingKelas ? { id: editingKelas.id, nama: formNamaKelas } : { nama: formNamaKelas }
      
      const res = await fetch('/api/kelas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Gagal menyimpan kelas')
      
      setShowKelasModal(false)
      setEditingKelas(null)
      setFormNamaKelas('')
      fetchData()
      setMessage({ type: 'success', text: 'Kelas berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan kelas' })
    }
  }

  const handleDeleteKelas = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kelas ini?')) return
    try {
      const res = await fetch(`/api/kelas?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      fetchData()
      setMessage({ type: 'success', text: 'Kelas berhasil dihapus!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus kelas' })
    }
  }

  // CRUD Absensi
  const handleSaveAbsensi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAbsensi) return
    try {
      const res = await fetch('/api/absensi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAbsensi.id, status: editingAbsensi.status, keterangan: editingAbsensi.keterangan })
      })
      if (!res.ok) throw new Error('Gagal mengupdate absensi')
      
      setShowAbsensiModal(false)
      setEditingAbsensi(null)
      fetchData()
      setMessage({ type: 'success', text: 'Absensi berhasil diupdate!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengupdate absensi' })
    }
  }

  const handleDeleteAbsensi = async (id: number) => {
    if (!confirm('Yakin ingin menghapus absensi ini?')) return
    try {
      const res = await fetch(`/api/absensi?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      fetchData()
      setMessage({ type: 'success', text: 'Absensi berhasil dihapus!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus absensi' })
    }
  }

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyright: formCopyright, logo: logoPreview || settings.logo })
      })
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan')
      
      fetchData()
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan' })
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran logo maksimal 2MB' })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Export Functions
  const exportToExcel = () => {
    const headers = ['No', 'Tanggal', 'NIS', 'Nama', 'Kelas', 'Status', 'Waktu', 'Keterangan']
    const rows = todayAbsensi.map((a, i) => [i + 1, a.tanggal, a.siswa.nis, a.siswa.nama, a.siswa.kelas, a.status.toUpperCase(), a.waktu, a.keterangan || '-'])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `absensi-${filterTanggal}-${selectedKelas.replace(/\s/g, '-')}.csv`
    link.click()
  }

  const exportToPDF = () => {
    const printContent = `
      <!DOCTYPE html><html><head><title>Laporan Absensi</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}h1{text-align:center}h2{text-align:center;color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#4F46E5;color:white}.hadir{background:#D1FAE5}.sakit{background:#FEF3C7}.izin{background:#DBEAFE}.alpha{background:#FEE2E2}</style>
      </head><body><h1>LAPORAN ABSENSI</h1><h2>SMK Handayani Banjaran</h2>
      <p style="text-align:center">Kelas: ${selectedKelas} | Tanggal: ${filterTanggal}</p>
      <table><thead><tr><th>No</th><th>NIS</th><th>Nama</th><th>Status</th><th>Waktu</th><th>Keterangan</th></tr></thead>
      <tbody>${todayAbsensi.map((a, i) => `<tr class="${a.status}"><td>${i + 1}</td><td>${a.siswa.nis}</td><td>${a.siswa.nama}</td><td>${a.status.toUpperCase()}</td><td>${a.waktu.slice(0, 5)}</td><td>${a.keterangan || '-'}</td></tr>`).join('')}</tbody></table>
      <p style="margin-top:30px;text-align:right">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p></body></html>`
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Status Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200'
      case 'sakit': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200'
      case 'izin': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200'
      case 'alpha': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir': return '✅'
      case 'sakit': return '🤒'
      case 'izin': return '📝'
      case 'alpha': return '❌'
      default: return '❓'
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className={`mt-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Header */}
      <header className={`shadow-lg border-b-4 border-blue-600 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">📚</div>
              )}
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                  Sistem Presensi Online
                </h1>
                <p className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>SMK Handayani Banjaran</p>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              <div className="text-right">
                <p className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formattedDate}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Jam: {currentTime} | Absen: {SCHOOL_CONFIG.absenStartTime} - {SCHOOL_CONFIG.absenEndTime}
                </p>
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'}`}>
                {darkMode ? '☀️' : '🌙'}
              </button>
              {isLoggedIn ? (
                <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                  🔓 Logout
                </button>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  🔐 Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabs */}
      <div className={`border-b sticky top-0 z-40 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            <button onClick={() => setActiveTab('absensi')} className={`px-4 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap ${activeTab === 'absensi' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              📝 Absensi Siswa
            </button>
            {isLoggedIn && (
              <button onClick={() => setActiveTab('admin')} className={`px-4 py-3 font-medium rounded-t-lg transition-all whitespace-nowrap ${activeTab === 'admin' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                ⚙️ Menu Admin
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🔐 Login Admin</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                <input type="text" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} placeholder="Masukkan username" />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} placeholder="Masukkan password" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Login</button>
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Message Alert */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200' : message.type === 'warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200' : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200'}`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* ===================== TAB ABSENSI SISWA ===================== */}
        {activeTab === 'absensi' && (
          <>
            {/* Class Selector */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pilih Kelas:</label>
                    <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className={`ml-2 px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                      {kelasList.map(k => (<option key={k.id} value={k.nama}>{k.nama}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal:</label>
                    <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className={`ml-2 px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">📥 Excel</button>
                  <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">📥 PDF</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Absensi */}
              <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h2 className="text-xl font-bold">📝 Form Absensi</h2>
                  <p className="text-blue-100 text-sm">Isi absensi harian siswa</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Location Status */}
                  {locationValid !== null && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${locationValid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      <span>{locationValid ? '✅' : '❌'}</span>
                      <span className="text-sm">{currentLocation || 'Mengambil lokasi...'}</span>
                    </div>
                  )}
                  {!isWithinAllowedTime() && (
                    <div className="p-3 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      ⏰ Absen Hadir: {SCHOOL_CONFIG.absenStartTime} - {SCHOOL_CONFIG.absenEndTime}
                    </div>
                  )}
                  
                  {/* Select Siswa */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pilih Siswa <span className="text-red-500">*</span></label>
                    <select value={selectedSiswa} onChange={(e) => setSelectedSiswa(e.target.value)} className={`w-full px-4 py-3 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required>
                      <option value="">-- Pilih Siswa --</option>
                      {belumAbsen.length > 0 ? belumAbsen.map((s) => (<option key={s.id} value={s.id}>{s.nis} - {s.nama}</option>)) : siswa.map((s) => (<option key={s.id} value={s.id}>{s.nis} - {s.nama}</option>))}
                    </select>
                    {belumAbsen.length > 0 && (<p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Menampilkan {belumAbsen.length} siswa yang belum absen</p>)}
                  </div>

                  {/* Status */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status Kehadiran <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {['hadir', 'sakit', 'izin', 'alpha'].map((s) => (
                        <button key={s} type="button" onClick={() => setStatus(s)} className={`p-3 rounded-lg border-2 font-medium transition-all ${status === s ? `${getStatusColor(s)} border-current shadow-md` : darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                          {getStatusIcon(s)} {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Foto - Untuk Semua Status */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Foto Bukti</label>
                    {!showCamera && !fotoPreview ? (
                      <div className="flex gap-3">
                        <label className={`flex-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                          <span className="text-3xl mb-2">📷</span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ambil Foto</span>
                          <button type="button" onClick={startCamera} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Buka Kamera</button>
                        </label>
                        <label className={`flex-1 flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-green-400 hover:bg-gray-700' : 'border-gray-300 hover:border-green-400 hover:bg-green-50'}`}>
                          <span className="text-3xl mb-2">📁</span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pilih File</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    ) : showCamera ? (
                      <div className="space-y-3">
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border-2 border-gray-200" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-2">
                          <button type="button" onClick={capturePhoto} className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">📸 Ambil Foto</button>
                          <button type="button" onClick={stopCamera} className="px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">✕ Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={fotoPreview || ''} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-gray-200" />
                        <button type="button" onClick={() => { setFoto(null); setFotoPreview(null) }} className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">✕ Hapus</button>
                      </div>
                    )}
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Keterangan (Opsional)</label>
                    <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Tambahkan catatan jika diperlukan..." rows={2} className={`w-full px-4 py-3 border-2 rounded-lg transition-all resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
                  </div>

                  {/* Submit Button */}
                  <button type="submit" disabled={submitting} className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${submitting ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'}`}>
                    {submitting ? 'Menyimpan...' : '✓ Simpan Absensi'}
                  </button>
                </form>
              </div>

              {/* Statistik & Daftar Hadir */}
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <div className={`rounded-lg shadow p-4 text-center border-l-4 border-green-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-2xl font-bold text-green-600">{todayStats.hadir.length}</p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hadir</p>
                  </div>
                  <div className={`rounded-lg shadow p-4 text-center border-l-4 border-yellow-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-2xl font-bold text-yellow-600">{todayStats.sakit.length}</p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sakit</p>
                  </div>
                  <div className={`rounded-lg shadow p-4 text-center border-l-4 border-blue-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-2xl font-bold text-blue-600">{todayStats.izin.length}</p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Izin</p>
                  </div>
                  <div className={`rounded-lg shadow p-4 text-center border-l-4 border-red-500 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <p className="text-2xl font-bold text-red-600">{todayStats.alpha.length}</p>
                    <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Alpha</p>
                  </div>
                </div>

                {/* Grafik Statistik */}
                <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className="font-bold mb-4">📊 Grafik Kehadiran Hari Ini</h3>
                  <div className="flex items-end gap-2 h-40">
                    {[
                      { label: 'Hadir', count: todayStats.hadir.length, color: 'bg-green-500' },
                      { label: 'Sakit', count: todayStats.sakit.length, color: 'bg-yellow-500' },
                      { label: 'Izin', count: todayStats.izin.length, color: 'bg-blue-500' },
                      { label: 'Alpha', count: todayStats.alpha.length, color: 'bg-red-500' }
                    ].map((item) => {
                      const total = todayStats.hadir.length + todayStats.sakit.length + todayStats.izin.length + todayStats.alpha.length
                      const height = total > 0 ? Math.max((item.count / total) * 100, 5) : 5
                      return (
                        <div key={item.label} className="flex-1 flex flex-col items-center">
                          <div className={`w-full ${item.color} rounded-t-lg transition-all`} style={{ height: `${height}%` }}></div>
                          <p className={`text-xs mt-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.label}</p>
                          <p className="text-sm font-bold">{item.count}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Belum Absen */}
                {belumAbsen.length > 0 && (
                  <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="bg-orange-500 text-white px-4 py-3">
                      <h3 className="font-bold">⏳ Belum Absen ({belumAbsen.length} siswa)</h3>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {belumAbsen.map((s) => (
                        <div key={s.id} className={`px-4 py-2 border-b flex items-center justify-between ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50'}`}>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{s.nama}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.nis}</p>
                          </div>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.jenisKelamin}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sudah Absen */}
                <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="bg-green-600 text-white px-4 py-3">
                    <h3 className="font-bold">✅ Sudah Absen ({todayAbsensi.length} siswa)</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {todayAbsensi.length === 0 ? (
                      <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada siswa yang absen hari ini</p>
                    ) : (
                      todayAbsensi.map((a) => (
                        <div key={a.id} className={`px-4 py-3 border-b flex items-center gap-3 ${darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50'}`}>
                          {a.foto ? (<img src={a.foto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />) : (<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">{getStatusIcon(a.status)}</div>)}
                          <div className="flex-1">
                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{a.siswa.nama}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.waktu.substring(0, 5)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>{getStatusIcon(a.status)} {a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================== TAB ADMIN ===================== */}
        {activeTab === 'admin' && isLoggedIn && (
          <>
            {/* Admin Sub-tabs */}
            <div className={`mb-4 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow flex flex-wrap gap-2`}>
              {[
                { id: 'siswa', label: '👥 Siswa' },
                { id: 'kelas', label: '🏫 Kelas' },
                { id: 'absensi', label: '📋 Absensi' },
                { id: 'pengaturan', label: '⚙️ Pengaturan' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setAdminTab(tab.id as any)} className={`px-4 py-2 rounded-lg font-medium transition-all ${adminTab === tab.id ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Kelola Siswa */}
            {adminTab === 'siswa' && (
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>👥 Kelola Data Siswa</h2>
                  <button onClick={() => { resetSiswaForm(); setEditingSiswa(null); setShowSiswaModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">+ Tambah Siswa</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>NIS</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nama</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Kelas</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>JK</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswa.map((s) => (
                        <tr key={s.id} className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{s.nis}</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{s.nama}</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{s.kelas}</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{s.jenisKelamin}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setFormNis(s.nis); setFormNama(s.nama); setFormKelas(s.kelas); setFormJk(s.jenisKelamin); setEditingSiswa(s); setShowSiswaModal(true); }} className="px-3 py-1 bg-blue-500 text-white rounded text-sm mr-1 hover:bg-blue-600">Edit</button>
                            <button onClick={() => handleDeleteSiswa(s.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Kelola Kelas */}
            {adminTab === 'kelas' && (
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>🏫 Kelola Data Kelas</h2>
                  <button onClick={() => { setFormNamaKelas(''); setEditingKelas(null); setShowKelasModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">+ Tambah Kelas</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kelasList.map((k) => (
                    <div key={k.id} className={`p-4 rounded-lg border-2 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
                      <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{k.nama}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setFormNamaKelas(k.nama); setEditingKelas(k); setShowKelasModal(true); }} className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Edit</button>
                        <button onClick={() => handleDeleteKelas(k.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kelola Absensi */}
            {adminTab === 'absensi' && (
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📋 Kelola Data Absensi</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Tanggal</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>NIS</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nama</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Keterangan</th>
                        <th className={`px-4 py-3 text-left ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAbsensi.map((a) => (
                        <tr key={a.id} className={`border-b ${darkMode ? 'border-gray-700' : ''}`}>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{a.tanggal}</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{a.siswa.nis}</td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{a.siswa.nama}</td>
                          <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>{getStatusIcon(a.status)} {a.status.toUpperCase()}</span></td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : ''}`}>{a.keterangan || '-'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setEditingAbsensi(a); setShowAbsensiModal(true); }} className="px-3 py-1 bg-blue-500 text-white rounded text-sm mr-1 hover:bg-blue-600">Edit</button>
                            <button onClick={() => handleDeleteAbsensi(a.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Hapus</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pengaturan */}
            {adminTab === 'pengaturan' && (
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>⚙️ Pengaturan Aplikasi</h2>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Logo Upload */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Logo Sekolah</label>
                    <div className="flex items-center gap-4">
                      {(logoPreview || settings.logo) && (
                        <img src={logoPreview || settings.logo || ''} alt="Logo Preview" className="w-20 h-20 object-contain border rounded-lg" />
                      )}
                      <label className={`flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${darkMode ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                        <span className="text-2xl mb-1">📷</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upload Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                  
                  {/* Copyright */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Teks Hak Cipta (Footer)</label>
                    <textarea value={formCopyright} onChange={(e) => setFormCopyright(e.target.value)} rows={2} className={`w-full px-4 py-3 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} placeholder="Contoh: © 2025 SMK Handayani Banjaran" />
                  </div>
                  
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">💾 Simpan Pengaturan</button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      {/* Siswa Modal */}
      {showSiswaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingSiswa ? '✏️ Edit Siswa' : '➕ Tambah Siswa'}</h2>
            <form onSubmit={handleSaveSiswa} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>NIS</label>
                <input type="text" value={formNis} onChange={(e) => setFormNis(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama</label>
                <input type="text" value={formNama} onChange={(e) => setFormNama(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kelas</label>
                <select value={formKelas} onChange={(e) => setFormKelas(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} required>
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jenis Kelamin</label>
                <select value={formJk} onChange={(e) => setFormJk(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={() => { setShowSiswaModal(false); setEditingSiswa(null); resetSiswaForm(); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kelas Modal */}
      {showKelasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingKelas ? '✏️ Edit Kelas' : '➕ Tambah Kelas'}</h2>
            <form onSubmit={handleSaveKelas} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Kelas</label>
                <input type="text" value={formNamaKelas} onChange={(e) => setFormNamaKelas(e.target.value)} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} placeholder="Contoh: XII TKJ 1" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={() => { setShowKelasModal(false); setEditingKelas(null); setFormNamaKelas(''); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Absensi Modal */}
      {showAbsensiModal && editingAbsensi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>✏️ Edit Absensi</h2>
            <form onSubmit={handleSaveAbsensi} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                <select value={editingAbsensi.status} onChange={(e) => setEditingAbsensi({ ...editingAbsensi, status: e.target.value })} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                  <option value="hadir">Hadir</option>
                  <option value="sakit">Sakit</option>
                  <option value="izin">Izin</option>
                  <option value="alpha">Alpha</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Keterangan</label>
                <textarea value={editingAbsensi.keterangan || ''} onChange={(e) => setEditingAbsensi({ ...editingAbsensi, keterangan: e.target.value })} className={`w-full px-4 py-2 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} rows={3} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={() => { setShowAbsensiModal(false); setEditingAbsensi(null); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`py-4 text-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} border-t`}>
        <p className="text-sm">{settings.copyright}</p>
      </footer>
    </div>
  )
}
