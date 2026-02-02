import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { qualityRuleSchema } from '@/lib/validations'
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

    const rule = await prisma.qualityRule.findUnique({
      where: { id: idBigInt },
      include: {
        category: true,
        versions: {
          orderBy: {
            version: 'desc'
          },
          take: 10
        }
      }
    })

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '质量规则不存在' },
        { status: 404 }
      )
    }

    return successResponse(rule)
  } catch (error) {
    console.error('Get quality rule error:', error)
    return NextResponse.json(
      { success: false, error: '获取质量规则信息失败' },
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
    const data = qualityRuleSchema.partial().parse(body)

    const currentRule = await prisma.qualityRule.findUnique({
      where: { id: idBigInt }
    })

    if (!currentRule) {
      return NextResponse.json(
        { success: false, error: '质量规则不存在' },
        { status: 404 }
      )
    }

    const newVersion = currentRule.version + 1

    await prisma.ruleVersion.create({
      data: {
        ruleId: idBigInt,
        version: currentRule.version,
        content: currentRule as any,
        createdBy: authUser.userId
      }
    })

    const rule = await prisma.qualityRule.update({
      where: { id: idBigInt },
      data: {
        ...data,
        version: newVersion,
        updatedBy: authUser.userId
      },
      include: {
        category: true
      }
    })

    return successResponse(rule, '更新质量规则成功')
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
        relatedQualityRuleId: idBigInt
      }
    })

    if (taskCount > 0) {
      return NextResponse.json(
        { success: false, error: '该质量规则已被任务引用，无法删除' },
        { status: 400 }
      )
    }

    await prisma.qualityRule.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除质量规则成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
