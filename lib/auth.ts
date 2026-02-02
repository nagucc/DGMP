import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse } from '@/lib/api-response'

export async function requireAuth(request: Request) {
  const user = getAuthUser(request as any)
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

export async function requirePermission(userId: bigint, permissionCode: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    throw new Error('USER_NOT_FOUND')
  }

  const hasPermission = user.userRoles.some(userRole =>
    userRole.role.rolePermissions.some(
      rolePermission => rolePermission.permission.code === permissionCode
    )
  )

  if (!hasPermission) {
    throw new Error('FORBIDDEN')
  }

  return user
}

export async function hasPermission(userId: bigint, permissionCode: string): Promise<boolean> {
  try {
    await requirePermission(userId, permissionCode)
    return true
  } catch (error) {
    return false
  }
}

export async function hasAnyPermission(userId: bigint, permissionCodes: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) return false

  const userPermissions = new Set<string>()
  user.userRoles.forEach(userRole => {
    userRole.role.rolePermissions.forEach(rolePermission => {
      userPermissions.add(rolePermission.permission.code)
    })
  })

  return permissionCodes.some(code => userPermissions.has(code))
}

export async function hasAllPermissions(userId: bigint, permissionCodes: string[]): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) return false

  const userPermissions = new Set<string>()
  user.userRoles.forEach(userRole => {
    userRole.role.rolePermissions.forEach(rolePermission => {
      userPermissions.add(rolePermission.permission.code)
    })
  })

  return permissionCodes.every(code => userPermissions.has(code))
}

export function isAdmin(user: any): boolean {
  return user.roles?.some((role: any) => role.code === 'admin') || false
}
