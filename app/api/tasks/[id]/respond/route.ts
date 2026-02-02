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
    const { action, rejectReason } = body

    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        assignedTo: authUser.userId,
        status: 'pending'
      },
      include: {
        task: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: '任务分配不存在或已处理' },
        { status: 404 }
      )
    }

    if (action === 'accept') {
      await prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: { status: 'accepted' }
      })

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'in_progress',
          actualStartTime: new Date(),
          updatedBy: authUser.userId
        }
      })

      return successResponse(null, '接收任务成功')
    } else if (action === 'reject') {
      if (!rejectReason) {
        return NextResponse.json(
          { success: false, error: '拒绝原因不能为空' },
          { status: 400 }
        )
      }

      await prisma.taskAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'rejected',
          rejectReason
        }
      })

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          updatedBy: authUser.userId
        }
      })

      return successResponse(null, '拒绝任务成功')
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
