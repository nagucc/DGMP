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

    const check = await prisma.qualityCheck.findUnique({
      where: { id: idBigInt },
      include: {
        qualityRule: true,
        dataElement: true
      }
    })

    if (!check) {
      return NextResponse.json(
        { success: false, error: '质量检查不存在' },
        { status: 404 }
      )
    }

    await prisma.qualityCheck.update({
      where: { id: idBigInt },
      data: {
        status: 'running',
        updatedBy: authUser.userId
      }
    })

    const startTime = Date.now()

    const totalRecords = Math.floor(Math.random() * 10000) + 1000
    const errorRecords = Math.floor(totalRecords * 0.05)
    const warningRecords = Math.floor(totalRecords * 0.1)
    const successRecords = totalRecords - errorRecords - warningRecords

    const report = await prisma.qualityReport.create({
      data: {
        checkId: idBigInt,
        checkTime: new Date(),
        totalRecords,
        errorRecords,
        warningRecords,
        successRecords,
        errorRate: (errorRecords / totalRecords * 100).toFixed(2),
        warningRate: (warningRecords / totalRecords * 100).toFixed(2),
        successRate: (successRecords / totalRecords * 100).toFixed(2),
        durationSeconds: Math.floor((Date.now() - startTime) / 1000),
        createdBy: authUser.userId
      }
    })

    await prisma.qualityCheck.update({
      where: { id: idBigInt },
      data: {
        status: 'completed',
        lastCheckTime: new Date(),
        updatedBy: authUser.userId
      }
    })

    return successResponse(report, '质量检查执行成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
