import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { taskSchema } from '@/lib/validations'
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
    const taskType = searchParams.get('taskType')
    const status = searchParams.get('status')

    const where: any = {}

    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } }
      ]
    }

    if (taskType) {
      where.taskType = taskType
    }

    if (status) {
      where.status = status
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
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
          assignments: {
            include: {
              assignee: {
                select: {
                  id: true,
                  username: true,
                  realName: true
                }
              }
            }
          },
          dataElement: true,
          qualityRule: true,
          mappingRule: true
        }
      }),
      prisma.task.count({ where })
    ])

    return successResponse({
      items: tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { success: false, error: '获取任务列表失败' },
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
    const data = taskSchema.parse(body)

    const code = data.code || generateCode('TASK')

    const task = await prisma.task.create({
      data: {
        ...data,
        code,
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
        dataElement: true,
        qualityRule: true,
        mappingRule: true
      }
    })

    return successResponse(task, '创建任务成功')
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
