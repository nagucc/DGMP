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
    const roleId = BigInt(id)

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json(
        { success: false, error: '角色不存在' },
        { status: 404 }
      )
    }

    return successResponse(role)
  } catch (error) {
    console.error('Get role error:', error)
    return NextResponse.json(
      { success: false, error: '获取角色信息失败' },
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
    const roleId = BigInt(id)
    const body = await request.json()
    const { name, description, permissionIds } = body

    if (permissionIds !== undefined) {
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      })

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId: bigint) => ({
            roleId,
            permissionId
          }))
        });
      }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description
      },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    })

    return successResponse(role, '更新角色成功')
  } catch (error) {
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
    const roleId = BigInt(id)

    const userCount = await prisma.userRole.count({
      where: { roleId }
    })

    if (userCount > 0) {
      return NextResponse.json(
        { success: false, error: '该角色下还有用户，无法删除' },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id: roleId }
    })

    return successResponse(null, '删除角色成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
