import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const formatRules = await prisma.formatRule.findMany({
      orderBy: {
        code: 'asc'
      }
    })

    return successResponse(formatRules)
  } catch (error) {
    console.error('Get format rules error:', error)
    return NextResponse.json(
      { success: false, error: '获取格式规则列表失败' },
      { status: 500 }
    )
  }
}
