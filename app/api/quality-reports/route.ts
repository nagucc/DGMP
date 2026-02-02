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
    const checkId = searchParams.get('checkId')

    const where: any = {}

    if (checkId) {
      where.checkId = BigInt(checkId)
    }

    const [reports, total] = await Promise.all([
      prisma.qualityReport.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'checkTime', 'desc'),
        include: {
          check: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          creator: {
            select: {
              id: true,
              username: true,
              realName: true
            }
          }
        }
      }),
      prisma.qualityReport.count({ where })
    ])

    return successResponse({
      items: reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get quality reports error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量报告列表失败' },
      { status: 500 }
    )
  }
}
