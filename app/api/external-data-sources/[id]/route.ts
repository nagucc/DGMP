import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { externalDataSourceSchema } from '@/lib/validations'
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

    const source = await prisma.externalDataSource.findUnique({
      where: { id: idBigInt },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        },
        syncTasks: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!source) {
      return NextResponse.json(
        { success: false, error: '外部数据源不存在' },
        { status: 404 }
      )
    }

    return successResponse(source)
  } catch (error) {
    console.error('Get external data source error:', error)
    return NextResponse.json(
      { success: false, error: '获取外部数据源信息失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()
    const data = externalDataSourceSchema.partial().parse(body)

    const source = await prisma.externalDataSource.update({
      where: { id: idBigInt },
      data: {
        ...data,
        updatedBy: authUser.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true
          }
        }
      }
    })

    return successResponse(source, '更新外部数据源成功')
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
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

    const syncTaskCount = await prisma.syncTask.count({
      where: { sourceId: idBigInt }
    })

    if (syncTaskCount > 0) {
      return NextResponse.json(
        { success: false, error: '该数据源下还有同步任务，无法删除' },
        { status: 400 }
      )
    }

    await prisma.externalDataSource.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除外部数据源成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
