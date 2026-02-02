import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { handlePrismaError } from '@/lib/db-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const taskId = BigInt(id)
    const body = await request.json()
    const { action, comment } = body

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    if (task.status !== 'reviewing') {
      return NextResponse.json(
        { success: false, error: '任务状态不允许审核' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          updatedBy: authUser.userId
        }
      })

      return successResponse(null, '审核通过')
    } else if (action === 'reject') {
      if (!comment) {
        return NextResponse.json(
          { success: false, error: '审核意见不能为空' },
          { status: 400 }
        )
      }

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'rejected',
          updatedBy: authUser.userId
        }
      })

      return successResponse(null, '审核驳回')
    } else {
      return NextResponse.json(
        { success: false, error: '无效的操作' },
        { status: 400 }
      )
    }
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
