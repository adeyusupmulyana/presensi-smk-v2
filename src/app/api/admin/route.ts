import { NextRequest, NextResponse } from 'next/server'

// POST - Login admin (simple hardcoded untuk stabilitas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Admin credentials - ganti sesuai kebutuhan
    const ADMIN_USERNAME = 'admin'
    const ADMIN_PASSWORD = 'B@l1k3un'

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, username: username })
    }

    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 })
  }
}
