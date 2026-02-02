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
    const module = searchParams.get('module')

    const where = module ? { module } : {}

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: {
        module: 'asc'
      }
    })

    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    }, {} as Record<string, typeof permissions>)

    return successResponse(groupedPermissions)
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json(
      { success: false, error: '获取权限列表失败' },
      { status: 500 }
    )
  }
}
