import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const dataTypes = await prisma.dataType.findMany({
      orderBy: {
        code: 'asc'
      }
    })

    return successResponse(dataTypes)
  } catch (error) {
    console.error('Get data types error:', error)
    return NextResponse.json(
      { success: false, error: '获取数据类型列表失败' },
      { status: 500 }
    )
  }
}
