import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { createUserSchema, updateUserSchema } from '@/lib/validations'
import { handlePrismaError, createPaginationParams } from '@/lib/db-utils'
import { hashPassword } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const keyword = searchParams.get('keyword') || ''

    const where = keyword
      ? {
          OR: [
            { username: { contains: keyword } },
            { realName: { contains: keyword } },
            { email: { contains: keyword } }
          ]
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        select: {
          id: true,
          username: true,
          email: true,
          realName: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    return successResponse({
      items: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          data.email ? { email: data.email } : undefined
        ].filter(Boolean)
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '用户名或邮箱已存在' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        realName: data.realName,
        createdBy: authUser.userId,
        userRoles: data.roleIds
          ? {
              create: data.roleIds.map(roleId => ({
                roleId,
                createdBy: authUser.userId
              }))
            }
          : undefined
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return successResponse(user, '创建用户成功')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
