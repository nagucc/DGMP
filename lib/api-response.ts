import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JwtPayload } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function createToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function getAuthUser(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export function unauthorizedResponse(message: string = '未授权访问') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  )
}

export function forbiddenResponse(message: string = '权限不足') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  )
}

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message
  })
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  )
}

export function validationErrorResponse(errors: Record<string, string[]>) {
  return NextResponse.json(
    { success: false, error: '验证失败', errors },
    { status: 400 }
  )
}
