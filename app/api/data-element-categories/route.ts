import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const categories = await prisma.dataElementCategory.findMany({
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        children: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    const buildTree = (parentId: bigint | null = null): any[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }))
    }

    const tree = buildTree(null)

    return successResponse(tree)
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { success: false, error: '获取分类列表失败' },
      { status: 500 }
    )
  }
}
