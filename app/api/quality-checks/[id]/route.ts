import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { handlePrismaError } from '@/lib/db-utils'

export async function GET(
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
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        },
        qualityRule: true,
        dataElement: true,
        reports: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!check) {
      return NextResponse.json(
        { success: false, error: '质量检查不存在' },
        { status: 404 }
      )
    }

    return successResponse(check)
  } catch (error) {
    console.error('Get quality check error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量检查信息失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.qualityCheck.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除质量检查成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
