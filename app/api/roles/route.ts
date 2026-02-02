import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { createPaginationParams } from '@/lib/db-utils'

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
            { code: { contains: keyword } },
            { name: { contains: keyword } }
          ]
        }
      : {}

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }),
      prisma.role.count({ where })
    ])

    return successResponse({
      items: roles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get roles error:', error)
    return NextResponse.json(
      { success: false, error: '获取角色列表失败' },
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
    const { code, name, description, permissionIds } = body

    const existingRole = await prisma.role.findUnique({
      where: { code }
    })

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: '角色编码已存在' },
        { status: 409 }
      )
    }

    const role = await prisma.role.create({
      data: {
        code,
        name,
        description,
        rolePermissions: permissionIds
          ? {
              create: permissionIds.map((permissionId: bigint) => ({
                permissionId
              }))
            }
          : undefined
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return successResponse(role, '创建角色成功')
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json(
      { success: false, error: '创建角色失败' },
      { status: 500 }
    )
  }
}
