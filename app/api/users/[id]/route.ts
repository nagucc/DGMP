import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { updateUserSchema } from '@/lib/validations'
import { handlePrismaError } from '@/lib/db-utils'
import { hashPassword } from '@/lib/utils'

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
    const userId = BigInt(id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    return successResponse(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
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
    const userId = BigInt(id)
    const body = await request.json()
    const data = updateUserSchema.parse(body)

    const updateData: any = {
      ...data,
      updatedBy: authUser.userId
    }

    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    if (data.roleIds !== undefined) {
      await prisma.userRole.deleteMany({
        where: { userId }
      })

      if (data.roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: data.roleIds.map(roleId => ({
            userId,
            roleId
          }))
        })
      }

      delete updateData.roleIds
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return successResponse(user, '更新用户成功')
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
    const userId = BigInt(id)

    if (userId === authUser.userId) {
      return NextResponse.json(
        { success: false, error: '不能删除自己' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return successResponse(null, '删除用户成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
