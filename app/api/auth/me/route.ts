import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(authUser.userId) },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
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

    const permissions = user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission)
    )

    return successResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        avatar: user.avatar,
        roles: user.userRoles.map(ur => ur.role)
      },
      permissions
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { success: false, error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}
