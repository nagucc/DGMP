import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
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
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (status) {
      where.status = status
    }

    const [checks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              realName: true
            }
          },
          qualityRule: true,
          dataElement: true
        }
      }),
      prisma.qualityCheck.count({ where })
    ])

    return successResponse({
      items: checks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get quality checks error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量检查列表失败' },
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
    const { code, name, description, qualityRuleId, dataElementId, checkType } = body

    const check = await prisma.qualityCheck.create({
      data: {
        code,
        name,
        description,
        qualityRuleId: BigInt(qualityRuleId),
        dataElementId: BigInt(dataElementId),
        checkType,
        status: 'pending',
        createdBy: authUser.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        },
        qualityRule: true,
        dataElement: true
      }
    })

    return successResponse(check, '创建质量检查成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
