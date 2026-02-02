import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateCode } from '@/lib/utils'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.username === data.username) {
        return NextResponse.json(
          { success: false, error: '用户名已存在' },
          { status: 409 }
        )
      }
      if (existingUser.email === data.email) {
        return NextResponse.json(
          { success: false, error: '邮箱已被使用' },
          { status: 409 }
        )
      }
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        realName: data.realName
      },
      select: {
        id: true,
        username: true,
        email: true,
        realName: true,
        avatar: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: '注册成功'
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, error: '注册失败' },
      { status: 500 }
    )
  }
}
