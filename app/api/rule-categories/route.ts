import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const categories = await prisma.ruleCategory.findMany({
      orderBy: {
        code: 'asc'
      }
    })

    return successResponse(categories)
  } catch (error) {
    console.error('Get rule categories error:', error)
    return NextResponse.json(
      { success: false, error: '获取规则分类列表失败' },
      { status: 500 }
    )
  }
}
