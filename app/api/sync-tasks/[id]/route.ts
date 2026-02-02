import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { syncTaskSchema } from '@/lib/validations'
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

    const syncTask = await prisma.syncTask.findUnique({
      where: { id: idBigInt },
      include: {
        source: true,
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        },
        syncRecords: {
          orderBy: {
            syncTime: 'desc'
          },
          take: 20
        }
      }
    })

    if (!syncTask) {
      return NextResponse.json(
        { success: false, error: '同步任务不存在' },
        { status: 404 }
      )
    }

    return successResponse(syncTask)
  } catch (error) {
    console.error('Get sync task error:', error)
    return NextResponse.json(
      { success: false, error: '获取同步任务信息失败' },
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
    const data = syncTaskSchema.partial().parse(body)

    const syncTask = await prisma.syncTask.update({
      where: { id: idBigInt },
      data: {
        ...data,
        updatedBy: authUser.userId
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

    return successResponse(syncTask, '更新同步任务成功')
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

    const syncTask = await prisma.syncTask.findUnique({
      where: { id: idBigInt },
      select: { syncEnabled: true }
    })

    if (syncTask?.syncEnabled) {
      return NextResponse.json(
        { success: false, error: '同步任务正在运行，无法删除' },
        { status: 400 }
      )
    }

    await prisma.syncTask.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除同步任务成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
