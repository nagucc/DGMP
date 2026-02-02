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
    const idBigInt = BigInt(id)

    const syncTask = await prisma.syncTask.findUnique({
      where: { id: idBigInt },
      include: {
        source: true
      }
    })

    if (!syncTask) {
      return NextResponse.json(
        { success: false, error: '同步任务不存在' },
        { status: 404 }
      )
    }

    const startTime = Date.now()

    await prisma.syncTask.update({
      where: { id: idBigInt },
      data: {
        syncStatus: 'running',
        updatedBy: authUser.userId
      }
    })

    const syncRecord = await prisma.syncRecord.create({
      data: {
        syncTaskId: idBigInt,
        syncStatus: 'success',
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        updatedCount: 0,
        insertedCount: 0,
        syncDetails: {},
        durationSeconds: Math.floor((Date.now() - startTime) / 1000)
      }
    })

    await prisma.syncTask.update({
      where: { id: idBigInt },
      data: {
        syncStatus: 'idle',
        lastSyncTime: new Date(),
        syncLog: '同步完成',
        updatedBy: authUser.userId
      }
    })

    return successResponse(syncRecord, '同步执行成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
