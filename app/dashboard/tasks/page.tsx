'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Space, Steps, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useAuthStore } from '@/lib/store/auth'

interface Task {
  id: bigint
  code: string
  name: string
  description: string | null
  taskType: string
  priority: string
  status: string
  planStartTime: string | null
  planEndTime: string | null
  createdAt: string
  creator: {
    id: bigint
    username: string
    realName: string | null
  }
  assignments: Array<{
    assignee: {
      id: bigint
      username: string
      realName: string | null
    }
    status: string
  }>
}

const taskTypeOptions = [
  { label: '数据清洗', value: 'cleaning' },
  { label: '数据集成', value: 'integration' },
  { label: '数据标准化', value: 'standardization' },
  { label: '质量检查', value: 'quality_check' },
  { label: '数据映射', value: 'mapping' }
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

const statusMap: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '执行中',
  reviewing: '待审核',
  completed: '已完成',
  rejected: '已驳回'
}

const statusColorMap: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'processing',
  reviewing: 'warning',
  completed: 'success',
  rejected: 'error'
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [form] = Form.useForm()
  const { token } = useAuthStore()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setTasks(result.data.items)
      }
    } catch (error) {
      message.error('获取任务列表失败')
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

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    form.setFieldsValue(task)
    setModalVisible(true)
  }

  const handleView = (task: Task) => {
    setSelectedTask(task)
    setDetailVisible(true)
  }

  const handleDelete = async (id: bigint) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该任务吗？',
      onOk: async () => {
        try {
          const response = await fetch(`/api/tasks/${id}`, {
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : '/api/tasks'
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

  const columns: ColumnsType<Task> = [
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
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type: string) => {
        const option = taskTypeOptions.find(o => o.value === type)
        return option?.label || type
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const option = priorityOptions.find(o => o.value === priority)
        return option?.label || priority
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ color: statusColorMap[status] }}>
          {statusMap[status]}
        </span>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assignments',
      key: 'assignee',
      render: (assignments: Task['assignments']) =>
        assignments.length > 0 ? assignments[0].assignee.realName : '-'
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
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
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
        <h1 className="text-2xl font-bold">任务管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增任务
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
        title={editingTask ? '编辑任务' : '新增任务'}
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
            name="taskType"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select options={taskTypeOptions} placeholder="请选择任务类型" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select options={priorityOptions} placeholder="请选择优先级" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <div>
            <Card title="基本信息" className="mb-4">
              <p><strong>编码：</strong>{selectedTask.code}</p>
              <p><strong>名称：</strong>{selectedTask.name}</p>
              <p><strong>描述：</strong>{selectedTask.description || '-'}</p>
              <p><strong>任务类型：</strong>{taskTypeOptions.find(o => o.value === selectedTask.taskType)?.label}</p>
              <p><strong>优先级：</strong>{priorityOptions.find(o => o.value === selectedTask.priority)?.label}</p>
              <p><strong>状态：</strong>{statusMap[selectedTask.status]}</p>
            </Card>
            <Card title="执行情况">
              <p><strong>创建人：</strong>{selectedTask.creator.realName || selectedTask.creator.username}</p>
              <p><strong>负责人：</strong>{selectedTask.assignments.length > 0 ? selectedTask.assignments[0].assignee.realName : '-'}</p>
              <p><strong>计划开始时间：</strong>{selectedTask.planStartTime ? new Date(selectedTask.planStartTime).toLocaleString('zh-CN') : '-'}</p>
              <p><strong>计划结束时间：</strong>{selectedTask.planEndTime ? new Date(selectedTask.planEndTime).toLocaleString('zh-CN') : '-'}</p>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}
