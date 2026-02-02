import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { dataElementSchema } from '@/lib/validations'
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

    const element = await prisma.dataElement.findUnique({
      where: { id: idBigInt },
      include: {
        dataType: true,
        formatRule: true,
        category: true,
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 10
        }
      }
    })

    if (!element) {
      return NextResponse.json(
        { success: false, error: '数据元不存在' },
        { status: 404 }
      )
    }

    return successResponse(element)
  } catch (error) {
    console.error('Get data element error:', error)
    return NextResponse.json(
      { success: false, error: '获取数据元信息失败' },
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
    const data = dataElementSchema.partial().parse(body)

    const currentElement = await prisma.dataElement.findUnique({
      where: { id: idBigInt }
    })

    if (!currentElement) {
      return NextResponse.json(
        { success: false, error: '数据元不存在' },
        { status: 404 }
      )
    }

    const newVersion = currentElement.version + 1

    await prisma.dataElementVersion.create({
      data: {
        dataElementId: idBigInt,
        version: currentElement.version,
        content: currentElement as any,
        createdBy: BigInt(authUser.userId)
      }
    })

    const element = await prisma.dataElement.update({
      where: { id: idBigInt },
      data: {
        ...data,
        version: newVersion,
        updatedBy: BigInt(authUser.userId)
      },
      include: {
        dataType: true,
        formatRule: true,
        category: true
      }
    })

    return successResponse(element, '更新数据元成功')
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

    const taskCount = await prisma.task.count({
      where: {
        relatedDataElementId: idBigInt
      }
    })

    if (taskCount > 0) {
      return NextResponse.json(
        { success: false, error: '该数据元已被任务引用，无法删除' },
        { status: 400 }
      )
    }

    await prisma.dataElement.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除数据元成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
