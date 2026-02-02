'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface QualityRule {
  id: bigint
  code: string
  name: string
  description: string | null
  ruleType: string
  severity: string
  category: { id: bigint; name: string } | null
  status: number
  createdAt: string
}

const ruleTypeOptions = [
  { label: '完整性', value: 'completeness' },
  { label: '一致性', value: 'consistency' },
  { label: '准确性', value: 'accuracy' },
  { label: '及时性', value: 'timeliness' },
  { label: '唯一性', value: 'uniqueness' },
  { label: '引用完整性', value: 'reference' }
]

const severityOptions = [
  { label: '错误', value: 'error' },
  { label: '警告', value: 'warning' },
  { label: '提示', value: 'info' }
]

export default function QualityRulesPage() {
  const [rules, setRules] = useState<QualityRule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<QualityRule | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchRules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quality-rules', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setRules(result.data.items)
      }
    } catch (error) {
      message.error('获取质量规则列表失败')
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

  const handleEdit = (rule: QualityRule) => {
    setEditingRule(rule)
    form.setFieldsValue(rule)
    setModalVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该质量规则吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/quality-rules/${id}`, {
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
        ? `/api/quality-rules/${editingRule.id}`
        : '/api/quality-rules'
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

  const columns: ColumnsType<QualityRule> = [
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
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      render: (type: string) => {
        const option = ruleTypeOptions.find(o => o.value === type)
        return <Tag color="blue">{option?.label}</Tag>
      }
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const color = severity === 'error' ? 'red' : severity === 'warning' ? 'orange' : 'green'
        const option = severityOptions.find(o => o.value === severity)
        return <Tag color={color}>{option?.label}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
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
        <h1 className="text-2xl font-bold">质量规则管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增规则
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
        title={editingRule ? '编辑质量规则' : '新增质量规则'}
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
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select options={ruleTypeOptions} placeholder="请选择规则类型" />
          </Form.Item>
          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select options={severityOptions} placeholder="请选择严重程度" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
