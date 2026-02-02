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
    const { executionLog, resultSummary, processedCount, successCount, failedCount } = body

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      )
    }

    const execution = await prisma.taskExecution.create({
      data: {
        taskId,
        executorId: authUser.userId,
        status: 'success',
        endTime: new Date(),
        executionLog,
        resultSummary,
        processedCount: processedCount || 0,
        successCount: successCount || 0,
        failedCount: failedCount || 0
      }
    })

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'reviewing',
        actualEndTime: new Date(),
        updatedBy: authUser.userId
      }
    })

    return successResponse(execution, '提交执行结果成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
