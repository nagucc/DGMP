import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, generateCode } from '@/lib/utils'
import { createToken } from '@/lib/api-response'
import { loginSchema, registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    if (user.status !== 1) {
      return NextResponse.json(
        { success: false, error: '账号已被禁用' },
        { status: 403 }
      )
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    const roles = user.userRoles.map(ur => ur.role.code)
    const token = createToken({
      userId: user.id.toString(),
      username: user.username,
      roles
    })

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          realName: user.realName,
          avatar: user.avatar,
          roles: user.userRoles.map(ur => ur.role)
        }
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}
