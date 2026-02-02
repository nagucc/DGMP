import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { dataElementSchema } from '@/lib/validations'
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
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (categoryId) {
      where.categoryId = BigInt(categoryId)
    }

    if (status !== null && status !== undefined) {
      where.status = parseInt(status)
    }

    const [elements, total] = await Promise.all([
      prisma.dataElement.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          dataType: true,
          formatRule: true,
          category: true
        }
      }),
      prisma.dataElement.count({ where })
    ])

    return successResponse({
      items: elements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get data elements error:', error)
    return NextResponse.json(
      { success: false, error: '获取数据元列表失败' },
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
    const data = dataElementSchema.parse(body)

    const existingElement = await prisma.dataElement.findUnique({
      where: { code: data.code }
    })

    if (existingElement) {
      return NextResponse.json(
        { success: false, error: '数据元编码已存在' },
        { status: 409 }
      )
    }

    const element = await prisma.dataElement.create({
      data: {
        ...data,
        createdBy: authUser.userId
      },
      include: {
        dataType: true,
        formatRule: true,
        category: true
      }
    })

    return successResponse(element, '创建数据元成功')
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
