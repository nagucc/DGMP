import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { handlePrismaError } from '@/lib/db-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const idBigInt = BigInt(id)

    const task = await prisma.task.findUnique({
      where: { id: idBigInt },
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
            },
            assigner: {
              select: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        },
        executions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        dataElement: true,
        qualityRule: true,
        mappingRule: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    return successResponse(task)
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { success: false, error: '获取任务信息失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const idBigInt = BigInt(id)
    const body = await request.json()

    const task = await prisma.task.update({
      where: { id: idBigInt },
      data: {
        ...body,
        updatedBy: authUser.userId
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

    return successResponse(task, '更新任务成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const idBigInt = BigInt(id)

    const task = await prisma.task.findUnique({
      where: { id: idBigInt },
      select: { status: true }
    })

    if (task && (task.status === 'in_progress' || task.status === 'reviewing')) {
      return NextResponse.json(
        { success: false, error: '任务正在执行或审核中，无法删除' },
        { status: 400 }
      )
    }

    await prisma.task.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除任务成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
