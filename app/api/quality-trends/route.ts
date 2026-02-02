import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const checkId = searchParams.get('checkId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!checkId) {
      return NextResponse.json(
        { success: false, error: '请指定检查ID' },
        { status: 400 }
      )
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const reports = await prisma.qualityReport.findMany({
      where: {
        checkId: BigInt(checkId),
        checkTime: {
          gte: startDate
        }
      },
      orderBy: {
        checkTime: 'asc'
      },
      select: {
        checkTime: true,
        totalRecords: true,
        errorRecords: true,
        warningRecords: true,
        successRecords: true,
        errorRate: true,
        warningRate: true,
        successRate: true
      }
    })

    const trend = reports.map(report => ({
      date: report.checkTime.toISOString().split('T')[0],
      totalRecords: report.totalRecords,
      errorRecords: report.errorRecords,
      warningRecords: report.warningRecords,
      successRecords: report.successRecords,
      errorRate: parseFloat(report.errorRate),
      warningRate: parseFloat(report.warningRate),
      successRate: parseFloat(report.successRate)
    }))

    return successResponse(trend)
  } catch (error) {
    console.error('Get quality trend error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量趋势数据失败' },
      { status: 500 }
    )
  }
}
