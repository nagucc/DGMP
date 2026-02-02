'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface SyncTask {
  id: bigint
  code: string
  name: string
  description: string | null
  syncType: string
  syncFrequency: string
  syncEnabled: boolean
  syncStatus: string
  lastSyncTime: string | null
  nextSyncTime: string | null
  createdAt: string
  source: {
    id: bigint
    name: string
  }
}

const syncTypeOptions = [
  { label: '数据元同步', value: 'data_element' },
  { label: '质量规则同步', value: 'quality_rule' },
  { label: '映射规则同步', value: 'mapping_rule' }
]

const syncFrequencyOptions = [
  { label: '手动', value: 'manual' },
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: 'Cron', value: 'cron' }
]

const syncStatusMap: Record<string, string> = {
  idle: '空闲',
  running: '运行中',
  success: '成功',
  failed: '失败'
}

const syncStatusColorMap: Record<string, string> = {
  idle: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error'
}

export default function SyncTasksPage() {
  const [tasks, setTasks] = useState<SyncTask[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<SyncTask | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sync-tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setTasks(result.data.items)
      }
    } catch (error) {
      message.error('获取同步任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleAdd = () => {
    setEditingTask(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (task: SyncTask) => {
    setEditingTask(task)
    form.setFieldsValue(task)
    setModalVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该同步任务吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/sync-tasks/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          const result = await response.json()
          if (result.success) {
            message.success('删除成功')
            fetchTasks()
          } else {
            message.error(result.error || '删除失败')
          }
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleExecute = async (id: bigint) => {
    try {
      const response = await fetch(`/api/sync-tasks/${id}/execute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        message.success('同步执行成功')
        fetchTasks()
      } else {
        message.error(result.error || '同步执行失败')
      }
    } catch (error) {
      message.error('同步执行失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const url = editingTask
        ? `/api/sync-tasks/${editingTask.id}`
        : '/api/sync-tasks'
      const method = editingTask ? 'PUT' : 'POST'

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
        message.success(editingTask ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchTasks()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<SyncTask> = [
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
      title: '同步类型',
      dataIndex: 'syncType',
      key: 'syncType',
      render: (type: string) => {
        const option = syncTypeOptions.find(o => o.value === type)
        return <Tag color="blue">{option?.label}</Tag>
      }
    },
    {
      title: '同步频率',
      dataIndex: 'syncFrequency',
      key: 'syncFrequency',
      render: (freq: string) => {
        const option = syncFrequencyOptions.find(o => o.value === freq)
        return option?.label || freq
      }
    },
    {
      title: '同步状态',
      dataIndex: 'syncStatus',
      key: 'syncStatus',
      render: (status: string) => (
        <Tag color={syncStatusColorMap[status]}>
          {syncStatusMap[status]}
        </Tag>
      )
    },
    {
      title: '启用',
      dataIndex: 'syncEnabled',
      key: 'syncEnabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '是' : '否'}
        </Tag>
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
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecute(record.id)}
          >
            执行
          </Button>
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
        <h1 className="text-2xl font-bold">同步任务管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增同步任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={editingTask ? '编辑同步任务' : '新增同步任务'}
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
            name="syncType"
            label="同步类型"
            rules={[{ required: true, message: '请选择同步类型' }]}
          >
            <Select options={syncTypeOptions} placeholder="请选择同步类型" />
          </Form.Item>
          <Form.Item
            name="syncFrequency"
            label="同步频率"
            rules={[{ required: true, message: '请选择同步频率' }]}
          >
            <Select options={syncFrequencyOptions} placeholder="请选择同步频率" />
          </Form.Item>
          <Form.Item
            name="syncEnabled"
            label="启用同步"
            valuePropName="checked"
          >
            <input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
