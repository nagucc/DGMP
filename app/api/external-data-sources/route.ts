import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { externalDataSourceSchema } from '@/lib/validations'
import { handlePrismaError, createPaginationParams } from '@/lib/db-utils'

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
    const sourceType = searchParams.get('sourceType')
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (sourceType) {
      where.sourceType = sourceType
    }

    if (status !== null && status !== undefined) {
      where.status = parseInt(status)
    }

    const [sources, total] = await Promise.all([
      prisma.externalDataSource.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              realName: true
            }
          }
        }
      }),
      prisma.externalDataSource.count({ where })
    ])

    return successResponse({
      items: sources,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get external data sources error:', error)
    return NextResponse.json(
      { success: false, error: '获取外部数据源列表失败' },
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
    const data = externalDataSourceSchema.parse(body)

    const existingSource = await prisma.externalDataSource.findUnique({
      where: { code: data.code }
    })

    if (existingSource) {
      return NextResponse.json(
        { success: false, error: '数据源编码已存在' },
        { status: 409 }
      )
    }

    const source = await prisma.externalDataSource.create({
      data: {
        ...data,
        createdBy: authUser.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        }
      }
    })

    return successResponse(source, '创建外部数据源成功')
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
