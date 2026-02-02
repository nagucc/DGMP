import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位')
})

export const registerSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名最多50位'),
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100位'),
  email: z.string().email('邮箱格式不正确').optional(),
  realName: z.string().max(50, '真实姓名最多50位').optional()
})

export const createUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名最多50位'),
  password: z.string().min(6, '密码至少6位').max(100, '密码最多100位'),
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  realName: z.string().max(50, '真实姓名最多50位').optional().nullable(),
  roleIds: z.array(z.bigint()).optional()
})

export const updateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional().nullable(),
  realName: z.string().max(50, '真实姓名最多50位').optional().nullable(),
  status: z.number().int().min(0).max(1).optional(),
  roleIds: z.array(z.bigint()).optional()
})

export const dataElementSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  dataTypeId: z.bigint().optional().nullable(),
  formatRuleId: z.bigint().optional().nullable(),
  length: z.number().int().positive().optional().nullable(),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().max(255).optional().nullable(),
  valueRange: z.string().max(255).optional().nullable(),
  businessRule: z.string().optional(),
  categoryId: z.bigint().optional().nullable()
})

export const qualityRuleSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  ruleType: z.enum(['completeness', 'consistency', 'accuracy', 'timeliness', 'uniqueness', 'reference']),
  dataSource: z.string().max(100).optional().nullable(),
  tableName: z.string().max(100).optional().nullable(),
  fieldName: z.string().max(100).optional().nullable(),
  ruleExpression: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  categoryId: z.bigint().optional().nullable()
})

export const mappingRuleSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  sourceSystem: z.string().min(1, '源系统不能为空').max(100),
  sourceTable: z.string().min(1, '源表不能为空').max(100),
  targetSystem: z.string().min(1, '目标系统不能为空').max(100),
  targetTable: z.string().min(1, '目标表不能为空').max(100),
  mappingType: z.enum(['one_to_one', 'one_to_many', 'many_to_one']).optional()
})

export const taskSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  taskType: z.enum(['cleaning', 'integration', 'standardization', 'quality_check', 'mapping']),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  relatedDataElementId: z.bigint().optional().nullable(),
  relatedQualityRuleId: z.bigint().optional().nullable(),
  relatedMappingRuleId: z.bigint().optional().nullable(),
  planStartTime: z.coerce.date().optional(),
  planEndTime: z.coerce.date().optional()
})

export const externalDataSourceSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  sourceType: z.enum(['database', 'api', 'file']),
  connectionConfig: z.record(z.any()),
  apiEndpoint: z.string().max(255).optional().nullable(),
  apiKey: z.string().max(255).optional().nullable()
})

export const syncTaskSchema = z.object({
  code: z.string().min(1, '编码不能为空').max(50, '编码最多50位'),
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100位'),
  description: z.string().optional(),
  syncType: z.enum(['data_element', 'quality_rule', 'mapping_rule']),
  sourceId: z.bigint(),
  targetType: z.string().min(1, '目标类型不能为空').max(50),
  targetConfig: z.record(z.any()),
  syncFrequency: z.enum(['manual', 'daily', 'weekly', 'monthly', 'cron']),
  cronExpression: z.string().max(100).optional().nullable(),
  syncEnabled: z.boolean().optional()
})
