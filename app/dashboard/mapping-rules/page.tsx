'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface MappingRule {
  id: bigint
  code: string
  name: string
  description: string | null
  sourceSystem: string
  sourceTable: string
  targetSystem: string
  targetTable: string
  mappingType: string
  status: number
  createdAt: string
}

const mappingTypeOptions = [
  { label: '一对一', value: 'one_to_one' },
  { label: '一对多', value: 'one_to_many' },
  { label: '多对一', value: 'many_to_one' }
]

export default function MappingRulesPage() {
  const [rules, setRules] = useState<MappingRule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<MappingRule | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchRules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/mapping-rules', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setRules(result.data.items)
      }
    } catch (error) {
      message.error('获取映射规则列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleAdd = () => {
    setEditingRule(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (rule: MappingRule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
    setModalVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该映射规则吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/mapping-rules/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            fetchRules()
          } else {
            message.error(result.error || '删除失败')
          }
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const url = editingRule
        ? `/api/mapping-rules/${editingRule.id}`
        : '/api/mapping-rules'
      const method = editingRule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingRule ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchRules()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<MappingRule> = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 150
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '源系统',
      dataIndex: 'sourceSystem',
      key: 'sourceSystem'
    },
    {
      title: '源表',
      dataIndex: 'sourceTable',
      key: 'sourceTable'
    },
    {
      title: '目标系统',
      dataIndex: 'targetSystem',
      key: 'targetSystem'
    },
    {
      title: '目标表',
      dataIndex: 'targetTable',
      key: 'targetTable'
    },
    {
      title: '映射类型',
      dataIndex: 'mappingType',
      key: 'mappingType',
      render: (type: string) => {
        const option = mappingTypeOptions.find(o => o.value === type)
        return option?.label || type
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <span>{status === 1 ? '启用' : '禁用'}</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">映射规则管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增映射规则
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingRule ? '编辑映射规则' : '新增映射规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input placeholder="请输入编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="sourceSystem"
            label="源系统"
            rules={[{ required: true, message: '请输入源系统' }]}
          >
            <Input placeholder="请输入源系统" />
          </Form.Item>
          <Form.Item
            name="sourceTable"
            label="源表"
            rules={[{ required: true, message: '请输入源表' }]}
          >
            <Input placeholder="请输入源表" />
          </Form.Item>
          <Form.Item
            name="targetSystem"
            label="目标系统"
            rules={[{ required: true, message: '请输入目标系统' }]}
          >
            <Input placeholder="请输入目标系统" />
          </Form.Item>
          <Form.Item
            name="targetTable"
            label="目标表"
            rules={[{ required: true, message: '请输入目标表' }]}
          >
            <Input placeholder="请输入目标表" />
          </Form.Item>
          <Form.Item
            name="mappingType"
            label="映射类型"
            rules={[{ required: true, message: '请选择映射类型' }]}
          >
            <Select options={mappingTypeOptions} placeholder="请选择映射类型" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
