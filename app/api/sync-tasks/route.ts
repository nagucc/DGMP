import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { syncTaskSchema } from '@/lib/validations'
import { handlePrismaError, createPaginationParams } from '@/lib/db-utils'
import { generateCode } from '@/lib/utils'

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
    const syncType = searchParams.get('syncType')
    const syncStatus = searchParams.get('syncStatus')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (syncType) {
      where.syncType = syncType
    }

    if (syncStatus) {
      where.syncStatus = syncStatus
    }

    const [syncTasks, total] = await Promise.all([
      prisma.syncTask.findMany({
        where,
        ...createPaginationParams(page, pageSize, 'createdAt', 'desc'),
        include: {
          source: true,
          creator: {
            select: {
              id: true,
              username: true,
              realName: true
            }
          }
        }
      }),
      prisma.syncTask.count({ where })
    ])

    return successResponse({
      items: syncTasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get sync tasks error:', error)
    return NextResponse.json(
      { success: false, error: '获取同步任务列表失败' },
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
    const data = syncTaskSchema.parse(body)

    const existingTask = await prisma.syncTask.findUnique({
      where: { code: data.code }
    })

    if (existingTask) {
      return NextResponse.json(
        { success: false, error: '同步任务编码已存在' },
        { status: 409 }
      )
    }

    const syncTask = await prisma.syncTask.create({
      data: {
        ...data,
        createdBy: authUser.userId
      },
      include: {
        source: true,
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        }
      }
    })

    return successResponse(syncTask, '创建同步任务成功')
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
