import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, unauthorizedResponse, successResponse } from '@/lib/api-response'
import { mappingRuleSchema } from '@/lib/validations'
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

    const rule = await prisma.mappingRule.findUnique({
      where: { id: idBigInt },
      include: {
        fieldMappings: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        valueMappings: true
      }
    })

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '映射规则不存在' },
        { status: 404 }
      )
    }

    return successResponse(rule)
  } catch (error) {
    console.error('Get mapping rule error:', error)
    return NextResponse.json(
      { success: false, error: '获取映射规则信息失败' },
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
    const { fieldMappings, valueMappings, ...ruleData } = body
    const data = mappingRuleSchema.partial().parse(ruleData)

    const currentRule = await prisma.mappingRule.findUnique({
      where: { id: idBigInt }
    })

    if (!currentRule) {
      return NextResponse.json(
        { success: false, error: '映射规则不存在' },
        { status: 404 }
      )
    }

    if (fieldMappings !== undefined) {
      await prisma.fieldMapping.deleteMany({
        where: { mappingRuleId: idBigInt }
      })

      if (fieldMappings.length > 0) {
        await prisma.fieldMapping.createMany({
          data: fieldMappings.map((fm: any) => ({
            mappingRuleId: idBigInt,
            sourceField: fm.sourceField,
            targetField: fm.targetField,
            transformExpression: fm.transformExpression,
            sortOrder: fm.sortOrder || 0
          }))
        })
      }
    }

    if (valueMappings !== undefined) {
      await prisma.valueMapping.deleteMany({
        where: { mappingRuleId: idBigInt }
      })

      if (valueMappings.length > 0) {
        await prisma.valueMapping.createMany({
          data: valueMappings.map((vm: any) => ({
            mappingRuleId: idBigInt,
            sourceValue: vm.sourceValue,
            targetValue: vm.targetValue,
            description: vm.description
          }))
        })
      }
    }

    const rule = await prisma.mappingRule.update({
      where: { id: idBigInt },
      data: {
        ...data,
        updatedBy: authUser.userId
      },
      include: {
        fieldMappings: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        valueMappings: true
      }
    })

    return successResponse(rule, '更新映射规则成功')
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
        relatedMappingRuleId: idBigInt
      }
    })

    if (taskCount > 0) {
      return NextResponse.json(
        { success: false, error: '该映射规则已被任务引用，无法删除' },
        { status: 400 }
      )
    }

    await prisma.mappingRule.delete({
      where: { id: idBigInt }
    })

    return successResponse(null, '删除映射规则成功')
  } catch (error) {
    const { message, status } = handlePrismaError(error)
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
