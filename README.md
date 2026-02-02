# DGMP - 数据治理管理平台

## 项目简介

DGMP（Data Governance Management Platform）是一个企业级的数据治理管理平台，旨在帮助组织建立完善的数据治理体系，实现数据全生命周期的管理。

## 功能特性

### 核心功能模块

1. **用户与权限管理**
   - 用户管理：创建、编辑、删除用户
   - 角色管理：定义角色和权限
   - 权限管理：细粒度的权限控制

2. **数据标准管理**
   - 数据元管理：定义和管理数据元
   - 数据类型管理：支持多种数据类型
   - 格式规范：定义数据格式标准
   - 分类管理：数据元分类组织

3. **数据质量规则管理**
   - 规则创建：创建自定义质量规则
   - 规则编辑：编辑现有规则
   - 规则测试：测试规则有效性
   - 规则模板：提供常用规则模板

4. **数据映射规则管理**
   - 字段映射：定义字段映射关系
   - 值映射：定义值转换规则
   - 转换规则：自定义数据转换逻辑

5. **任务管理**
   - 任务创建：创建数据治理任务
   - 任务分配：分配任务给相关人员
   - 任务执行：跟踪任务执行进度
   - 任务审核：审核任务结果

6. **执行跟踪**
   - 日志记录：记录操作日志
   - 进度监控：实时监控任务进度
   - 结果查看：查看执行结果

7. **质量检查**
   - 检查执行：执行数据质量检查
   - 报告生成：生成质量报告
   - 趋势分析：分析质量趋势

8. **外部数据源管理**
   - 数据源配置：配置外部数据源
   - 连接测试：测试数据源连接

9. **数据同步管理**
   - 同步任务：创建数据同步任务
   - 定时同步：配置定时同步
   - 同步记录：查看同步历史

## 技术栈

### 前端
- Next.js 14（App Router）
- React 18
- TypeScript
- Ant Design 5
- Ant Design Charts
- Tailwind CSS
- Zustand（状态管理）

### 后端
- Next.js API Routes
- Prisma ORM
- MySQL

### 工具库
- Zod（数据验证）
- bcrypt（密码加密）
- jsonwebtoken（JWT认证）
- node-cron（定时任务）

## 项目结构

```
DGMP/
├── app/                    # Next.js应用目录
│   ├── api/               # API路由
│   │   ├── auth/          # 认证相关
│   │   ├── users/         # 用户管理
│   │   ├── roles/         # 角色管理
│   │   ├── data-elements/ # 数据标准
│   │   ├── quality-rules/ # 质量规则
│   │   ├── mapping-rules/ # 映射规则
│   │   ├── tasks/         # 任务管理
│   │   ├── quality-checks/# 质量检查
│   │   ├── external-data-sources/ # 数据源
│   │   └── sync-tasks/    # 同步任务
│   ├── dashboard/         # 前端页面
│   ├── login/            # 登录页面
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── lib/                  # 工具库
│   ├── prisma.ts         # Prisma客户端
│   ├── auth.ts           # 认证工具
│   ├── validations.ts     # 数据验证
│   ├── api-response.ts    # API响应工具
│   ├── db-utils.ts       # 数据库工具
│   ├── utils.ts          # 通用工具
│   └── store/            # 状态管理
├── prisma/               # Prisma配置
│   └── schema.prisma     # 数据库模型
├── docs/                 # 文档
│   ├── requirements.md   # 需求文档
│   └── design.md        # 设计文档
└── package.json          # 项目配置
```

## 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- MySQL 8.0 或更高版本
- Docker（用于运行MySQL容器）

### 安装步骤

1. 克隆项目

```bash
git clone <repository-url>
cd DGMP
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量

创建 `.env` 文件并配置以下变量：

```env
# 数据库配置
DATABASE_URL="mysql://root:root123@localhost:3306/mydb"

# JWT密钥
JWT_SECRET="your-secret-key-here"
```

4. 启动MySQL数据库

```bash
docker run --name mysql -e MYSQL_ROOT_PASSWORD=root123 -e MYSQL_DATABASE=mydb -p 3306:3306 -d mysql:8.0
```

5. 初始化数据库

```bash
npm run db:push
```

6. 启动开发服务器

```bash
npm run dev
```

7. 访问应用

打开浏览器访问 `http://localhost:3000`

## 数据库配置

项目使用本地Docker容器中的MySQL数据库，配置信息如下：

- 数据库主机：localhost
- 数据库端口：3306
- 数据库用户名：root
- 数据库密码：root123
- 数据库名称：mydb

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行代码检查
- `npm run db:generate` - 生成Prisma客户端
- `npm run db:push` - 推送数据库变更
- `npm run db:migrate` - 运行数据库迁移
- `npm run db:studio` - 打开Prisma Studio

## 开发工具

项目已配置以下开发工具：

- ESLint - 代码检查
- Prettier - 代码格式化
- Husky - Git hooks
- lint-staged - 提交前检查

## 部署

### 生产环境部署

1. 构建项目

```bash
npm run build
```

2. 启动生产服务器

```bash
npm start
```

### Docker部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建并运行：

```bash
docker build -t dgmp .
docker run -p 3000:3000 dgmp
```

## API文档

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理

- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 角色管理

- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `GET /api/roles/:id` - 获取角色详情
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 数据标准管理

- `GET /api/data-elements` - 获取数据元列表
- `POST /api/data-elements` - 创建数据元
- `GET /api/data-elements/:id` - 获取数据元详情
- `PUT /api/data-elements/:id` - 更新数据元
- `DELETE /api/data-elements/:id` - 删除数据元

### 质量规则管理

- `GET /api/quality-rules` - 获取质量规则列表
- `POST /api/quality-rules` - 创建质量规则
- `GET /api/quality-rules/:id` - 获取质量规则详情
- `PUT /api/quality-rules/:id` - 更新质量规则
- `DELETE /api/quality-rules/:id` - 删除质量规则

### 任务管理

- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `GET /api/tasks/:id` - 获取任务详情
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `POST /api/tasks/:id/assign` - 分配任务
- `POST /api/tasks/:id/respond` - 响应任务
- `POST /api/tasks/:id/complete` - 完成任务
- `POST /api/tasks/:id/review` - 审核任务

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目。

## 许可证

MIT License
