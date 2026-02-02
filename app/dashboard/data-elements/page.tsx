'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface DataElement {
  id: bigint
  code: string
  name: string
  description: string | null
  dataType: { id: bigint; name: string } | null
  category: { id: bigint; name: string } | null
  status: number
  createdAt: string
}

export default function DataElementsPage() {
  const [elements, setElements] = useState<DataElement[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingElement, setEditingElement] = useState<DataElement | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchElements = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data-elements', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setElements(result.data.items)
      }
    } catch (error) {
      message.error('获取数据元列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElements()
  }, [])

  const handleAdd = () => {
    setEditingElement(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (element: DataElement) => {
    setEditingElement(element)
    form.setFieldsValue(element)
    setModalVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该数据元吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/data-elements/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            fetchElements()
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
      const url = editingElement
        ? `/api/data-elements/${editingElement.id}`
        : '/api/data-elements'
      const method = editingElement ? 'PUT' : 'POST'

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
        message.success(editingElement ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchElements()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<DataElement> = [
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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (dataType) => dataType?.name || '-'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category?.name || '-'
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
        <h1 className="text-2xl font-bold">数据标准管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增数据元
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={elements}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingElement ? '编辑数据元' : '新增数据元'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
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
        </Form>
      </Modal>
    </div>
  )
}
