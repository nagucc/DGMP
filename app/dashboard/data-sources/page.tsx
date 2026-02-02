'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface ExternalDataSource {
  id: bigint
  code: string
  name: string
  description: string | null
  sourceType: string
  status: number
  lastSyncTime: string | null
  createdAt: string
}

const sourceTypeOptions = [
  { label: '数据库', value: 'database' },
  { label: 'API', value: 'api' },
  { label: '文件', value: 'file' }
]

export default function DataSourcesPage() {
  const [sources, setSources] = useState<ExternalDataSource[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSource, setEditingSource] = useState<ExternalDataSource | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchSources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/external-data-sources', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setSources(result.data.items)
      }
    } catch (error) {
      message.error('获取数据源列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])

  const handleAdd = () => {
    setEditingSource(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (source: ExternalDataSource) => {
    setEditingSource(source)
    form.setFieldsValue(source)
    setModalVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该数据源吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/external-data-sources/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            fetchSources()
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
      const url = editingSource
        ? `/api/external-data-sources/${editingSource.id}`
        : '/api/external-data-sources'
      const method = editingSource ? 'PUT' : 'POST'

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
        message.success(editingSource ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchSources()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<ExternalDataSource> = [
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
      title: '类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (type: string) => {
        const option = sourceTypeOptions.find(o => o.value === type)
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
      title: '最后同步时间',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (date: string | null) => 
        date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
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
        <h1 className="text-2xl font-bold">数据源管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增数据源
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={sources}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingSource ? '编辑数据源' : '新增数据源'}
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
            name="sourceType"
            label="数据源类型"
            rules={[{ required: true, message: '请选择数据源类型' }]}
          >
            <Select options={sourceTypeOptions} placeholder="请选择数据源类型" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
