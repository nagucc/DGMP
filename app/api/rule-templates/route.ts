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
    const ruleType = searchParams.get('ruleType')

    const where = ruleType ? { ruleType } : {}

    const templates = await prisma.ruleTemplate.findMany({
      where,
      orderBy: {
        code: 'asc'
      }
    })

    return successResponse(templates)
  } catch (error) {
    console.error('Get rule templates error:', error)
    return NextResponse.json(
      { success: false, error: '获取规则模板列表失败' },
      { status: 500 }
    )
  }
}
