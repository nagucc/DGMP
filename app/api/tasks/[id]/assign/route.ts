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
    const { assignedTo, deadline } = body

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    if (task.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '任务状态不允许分配' },
        { status: 400 }
      )
    }

    await prisma.taskAssignment.create({
      data: {
        taskId,
        assignedTo: BigInt(assignedTo),
        assignedBy: authUser.userId,
        deadline: deadline ? new Date(deadline) : null
      }
    })

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'assigned',
        updatedBy: authUser.userId
      }
    })

    return successResponse(null, '分配任务成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
