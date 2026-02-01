# 数据治理管理平台（DGMP）设计文档

## 1. 系统架构

### 1.1 整体架构

DGMP采用前后端分离的架构，基于Next.js App Router实现全栈应用。

```mermaid
flowchart TD
    subgraph client_layer[客户端层]
        browser[浏览器客户端]
        mobile[移动端客户端]
        third[第三方集成]
    end

    subgraph nextjs_layer[Next.js 应用层]
        app_router[App Router]
        api_routes[API Routes]
        server_components[Server Components]
        
        subgraph app_router_content
            pages[Pages]
            layouts[Layouts]
            components[Components]
        end
        
        app_router --> app_router_content
    end

    subgraph service_layer[服务层]
        auth_service[认证服务]
        permission_service[权限服务]
        business_service[业务服务]
        rule_engine[规则引擎]
        task_scheduler[任务调度]
        quality_check[质量检查]
    end

    subgraph data_layer[数据层]
        mysql[(MySQL\nDocker)]
        redis[(Redis\n缓存)]
        file_storage[(文件存储\n日志/附件)]
    end

    client_layer --> nextjs_layer
    nextjs_layer --> service_layer
    service_layer --> data_layer
    
    api_routes --> service_layer
    server_components --> service_layer
```

### 1.2 分层设计

| 层级 | 技术选型 | 职责 |
|------|----------|------|
| 表现层 | Next.js Pages + Antd | 页面渲染、用户交互 |
| API层 | Next.js API Routes | 接口定义、请求处理 |
| 服务层 | TypeScript Classes | 业务逻辑处理 |
| 数据访问层 | Prisma ORM | 数据库操作 |
| 数据层 | MySQL | 数据持久化 |

## 2. 技术栈

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.x | 全栈框架 |
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型系统 |
| Ant Design | 5.x | UI组件库 |
| Ant Design Charts | 2.x | 图表组件 |
| Tailwind CSS | 3.x | 样式工具 |
| Zustand | 4.x | 状态管理 |
| React Query | 5.x | 数据获取 |
| Zod | 3.x | 数据验证 |
| Day.js | 1.x | 日期处理 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14.x | API服务 |
| Prisma | 5.x | ORM |
| MySQL | 8.x | 数据库 |
| Redis | 7.x | 缓存 |
| bcrypt | 5.x | 密码加密 |
| jsonwebtoken | 9.x | JWT认证 |
| node-cron | 3.x | 定时任务 |

### 2.3 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| ESLint | 8.x | 代码检查 |
| Prettier | 3.x | 代码格式化 |
| TypeScript | 5.x | 类型检查 |
| Husky | 8.x | Git钩子 |
| lint-staged | 15.x | 暂存文件检查 |

## 3. 数据库设计

### 3.1 数据库配置

```yaml
数据库类型: MySQL
版本: 8.0
主机: localhost (docker容器中)
端口: 3306
数据库名: mydb
用户名: root
密码: root123
字符集: utf8mb4
排序规则: utf8mb4_unicode_ci
```

### 3.2 ER图

```mermaid
erDiagram
    User ||--o{ UserRole : has
    UserRole ||--o{ Role : belongs_to
    Role ||--o{ RolePermission : has
    RolePermission ||--o{ Permission : belongs_to
    
    User ||--o{ Task : creates
    User ||--o{ TaskExecution : executes
    Task ||--o{ TaskAssignment : has
    TaskAssignment ||--o{ User : assigned_to
    
    DataElement ||--o{ DataType : has
    DataElement ||--o{ FormatRule : has
    DataElement ||--o{ DataElementVersion : has
    DataElementCategory ||--o{ DataElement : contains
    
    QualityRule ||--o{ RuleCategory : has
    QualityRule ||--o{ RuleVersion : has
    
    MappingRule ||--o{ FieldMapping : has
    MappingRule ||--o{ ValueMapping : has
    
    QualityCheck ||--o{ QualityReport : generates
    QualityReport ||--o{ QualityIssue : contains
    
    ExternalDataSource ||--o{ SyncTask : has
    SyncTask ||--o{ SyncRecord : generates
```

### 3.3 表结构设计

#### 3.3.1 用户与权限

**dgmp_users**
```sql
CREATE TABLE dgmp_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  real_name VARCHAR(50),
  avatar VARCHAR(255),
  status TINYINT DEFAULT 1 COMMENT '1:active, 0:inactive',
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_roles**
```sql
CREATE TABLE dgmp_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_permissions**
```sql
CREATE TABLE dgmp_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_user_roles**
```sql
CREATE TABLE dgmp_user_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES dgmp_users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES dgmp_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_role_permissions**
```sql
CREATE TABLE dgmp_role_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES dgmp_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES dgmp_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.2 数据标准

**dgmp_data_elements**
```sql
CREATE TABLE dgmp_data_elements (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  data_type_id BIGINT,
  format_rule_id BIGINT,
  length INT,
  is_required TINYINT DEFAULT 0,
  default_value VARCHAR(255),
  value_range VARCHAR(255),
  business_rule TEXT,
  category_id BIGINT,
  version INT DEFAULT 1,
  status TINYINT DEFAULT 1,
  source_system VARCHAR(100) COMMENT '外部数据源标识',
  source_code VARCHAR(100) COMMENT '外部系统中的编码',
  sync_enabled TINYINT DEFAULT 0 COMMENT '是否启用同步',
  sync_frequency VARCHAR(50) COMMENT '同步频率：manual,daily,weekly,monthly',
  last_sync_time DATETIME COMMENT '最后同步时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  INDEX idx_source (source_system, source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_data_types**
```sql
CREATE TABLE dgmp_data_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  validation_rule TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_format_rules**
```sql
CREATE TABLE dgmp_format_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  regex_pattern VARCHAR(500),
  example VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_data_element_categories**
```sql
CREATE TABLE dgmp_data_element_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id BIGINT,
  level INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_data_element_versions**
```sql
CREATE TABLE dgmp_data_element_versions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  data_element_id BIGINT NOT NULL,
  version INT NOT NULL,
  content JSON NOT NULL,
  change_log TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  UNIQUE KEY uk_element_version (data_element_id, version),
  FOREIGN KEY (data_element_id) REFERENCES dgmp_data_elements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.3 质量规则

**dgmp_quality_rules**
```sql
CREATE TABLE dgmp_quality_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL COMMENT 'completeness,consistency,accuracy,timeliness,uniqueness,reference',
  data_source VARCHAR(100),
  table_name VARCHAR(100),
  field_name VARCHAR(100),
  rule_expression TEXT,
  severity VARCHAR(20) DEFAULT 'error' COMMENT 'error,warning,info',
  category_id BIGINT,
  version INT DEFAULT 1,
  status TINYINT DEFAULT 1,
  source_system VARCHAR(100) COMMENT '外部数据源标识',
  source_code VARCHAR(100) COMMENT '外部系统中的编码',
  sync_enabled TINYINT DEFAULT 0 COMMENT '是否启用同步',
  sync_frequency VARCHAR(50) COMMENT '同步频率：manual,daily,weekly,monthly',
  last_sync_time DATETIME COMMENT '最后同步时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_type (rule_type),
  INDEX idx_status (status),
  INDEX idx_source (source_system, source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_rule_categories**
```sql
CREATE TABLE dgmp_rule_categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_rule_templates**
```sql
CREATE TABLE dgmp_rule_templates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL,
  template_expression TEXT,
  parameters JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_rule_versions**
```sql
CREATE TABLE dgmp_rule_versions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  rule_id BIGINT NOT NULL,
  version INT NOT NULL,
  content JSON NOT NULL,
  change_log TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT,
  UNIQUE KEY uk_rule_version (rule_id, version),
  FOREIGN KEY (rule_id) REFERENCES dgmp_quality_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.4 映射规则

**dgmp_mapping_rules**
```sql
CREATE TABLE dgmp_mapping_rules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  source_system VARCHAR(100) NOT NULL,
  source_table VARCHAR(100) NOT NULL,
  target_system VARCHAR(100) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  mapping_type VARCHAR(20) DEFAULT 'one_to_one' COMMENT 'one_to_one,one_to_many,many_to_one',
  status TINYINT DEFAULT 1,
  source_system VARCHAR(100) COMMENT '外部数据源标识',
  source_code VARCHAR(100) COMMENT '外部系统中的编码',
  sync_enabled TINYINT DEFAULT 0 COMMENT '是否启用同步',
  sync_frequency VARCHAR(50) COMMENT '同步频率：manual,daily,weekly,monthly',
  last_sync_time DATETIME COMMENT '最后同步时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_source (source_system, source_table),
  INDEX idx_target (target_system, target_table),
  INDEX idx_sync_source (source_system, source_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_field_mappings**
```sql
CREATE TABLE dgmp_field_mappings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  mapping_rule_id BIGINT NOT NULL,
  source_field VARCHAR(100) NOT NULL,
  target_field VARCHAR(100) NOT NULL,
  transform_expression TEXT,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mapping_rule_id) REFERENCES dgmp_mapping_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_value_mappings**
```sql
CREATE TABLE dgmp_value_mappings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  mapping_rule_id BIGINT NOT NULL,
  field_mapping_id BIGINT,
  source_value VARCHAR(255) NOT NULL,
  target_value VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mapping_rule_id) REFERENCES dgmp_mapping_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.5 任务管理

**dgmp_tasks**
```sql
CREATE TABLE dgmp_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL COMMENT 'cleaning,integration,standardization,quality_check,mapping',
  priority VARCHAR(20) DEFAULT 'medium' COMMENT 'high,medium,low',
  status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending,assigned,in_progress,reviewing,completed,rejected',
  related_data_element_id BIGINT,
  related_quality_rule_id BIGINT,
  related_mapping_rule_id BIGINT,
  plan_start_time DATETIME,
  plan_end_time DATETIME,
  actual_start_time DATETIME,
  actual_end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_status (status),
  INDEX idx_type (task_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_task_assignments**
```sql
CREATE TABLE dgmp_task_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  assigned_to BIGINT NOT NULL,
  assigned_by BIGINT,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deadline DATETIME,
  status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending,accepted,rejected',
  reject_reason TEXT,
  FOREIGN KEY (task_id) REFERENCES dgmp_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES dgmp_users(id),
  FOREIGN KEY (assigned_by) REFERENCES dgmp_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_task_executions**
```sql
CREATE TABLE dgmp_task_executions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  executor_id BIGINT,
  status VARCHAR(20) DEFAULT 'running' COMMENT 'running,success,failed',
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  execution_log TEXT,
  result_summary JSON,
  processed_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES dgmp_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (executor_id) REFERENCES dgmp_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.6 质量检查

**dgmp_quality_checks**
```sql
CREATE TABLE dgmp_quality_checks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  data_source VARCHAR(100),
  rule_ids JSON,
  status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending,running,completed,failed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_quality_reports**
```sql
CREATE TABLE dgmp_quality_reports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quality_check_id BIGINT NOT NULL,
  check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(100),
  total_score DECIMAL(5,2),
  dimension_scores JSON,
  issue_summary JSON,
  data_samples JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quality_check_id) REFERENCES dgmp_quality_checks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_quality_issues**
```sql
CREATE TABLE dgmp_quality_issues (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  quality_report_id BIGINT NOT NULL,
  rule_id BIGINT,
  rule_code VARCHAR(50),
  rule_name VARCHAR(100),
  severity VARCHAR(20),
  issue_description TEXT,
  affected_records INT DEFAULT 0,
  sample_data JSON,
  assignee_id BIGINT,
  status VARCHAR(20) DEFAULT 'open' COMMENT 'open,in_progress,resolved,closed',
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quality_report_id) REFERENCES dgmp_quality_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.7 外部数据源与同步

**dgmp_external_data_sources**
```sql
CREATE TABLE dgmp_external_data_sources (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  source_type VARCHAR(50) NOT NULL COMMENT 'database,api,file',
  connection_config JSON COMMENT '连接配置信息',
  api_endpoint VARCHAR(255) COMMENT 'API端点',
  api_key VARCHAR(255) COMMENT 'API密钥',
  status TINYINT DEFAULT 1 COMMENT '1:active, 0:inactive',
  last_sync_time DATETIME COMMENT '最后同步时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_type (source_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_sync_tasks**
```sql
CREATE TABLE dgmp_sync_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sync_type VARCHAR(50) NOT NULL COMMENT 'data_element,quality_rule,mapping_rule',
  source_id BIGINT NOT NULL COMMENT '外部数据源ID',
  target_type VARCHAR(50) NOT NULL COMMENT '同步目标类型',
  target_config JSON COMMENT '同步目标配置',
  sync_frequency VARCHAR(50) NOT NULL COMMENT 'manual,daily,weekly,monthly,cron',
  cron_expression VARCHAR(100) COMMENT 'Cron表达式',
  sync_enabled TINYINT DEFAULT 1 COMMENT '是否启用同步',
  last_sync_time DATETIME COMMENT '最后同步时间',
  next_sync_time DATETIME COMMENT '下次同步时间',
  sync_status VARCHAR(20) DEFAULT 'idle' COMMENT 'idle,running,success,failed',
  sync_log TEXT COMMENT '同步日志',
  error_message TEXT COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT,
  updated_by BIGINT,
  INDEX idx_code (code),
  INDEX idx_type (sync_type),
  INDEX idx_status (sync_status),
  INDEX idx_next_sync (next_sync_time),
  FOREIGN KEY (source_id) REFERENCES dgmp_external_data_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_sync_records**
```sql
CREATE TABLE dgmp_sync_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sync_task_id BIGINT NOT NULL,
  sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_status VARCHAR(20) NOT NULL COMMENT 'success,failed,partial',
  total_count INT DEFAULT 0 COMMENT '总记录数',
  success_count INT DEFAULT 0 COMMENT '成功数',
  failed_count INT DEFAULT 0 COMMENT '失败数',
  updated_count INT DEFAULT 0 COMMENT '更新数',
  inserted_count INT DEFAULT 0 COMMENT '新增数',
  sync_details JSON COMMENT '同步详情',
  error_message TEXT COMMENT '错误信息',
  duration_seconds INT COMMENT '耗时(秒)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_task (sync_task_id),
  INDEX idx_sync_time (sync_time),
  INDEX idx_status (sync_status),
  FOREIGN KEY (sync_task_id) REFERENCES dgmp_sync_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.8 系统管理

**dgmp_system_configs**
```sql
CREATE TABLE dgmp_system_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_audit_logs**
```sql
CREATE TABLE dgmp_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  username VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details JSON,
  ip VARCHAR(50),
  user_agent VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**dgmp_notifications**
```sql
CREATE TABLE dgmp_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(50) DEFAULT 'info' COMMENT 'info,warning,error,success',
  is_read TINYINT DEFAULT 0,
  related_type VARCHAR(50) COMMENT '关联类型',
  related_id BIGINT COMMENT '关联ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES dgmp_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 4. 前端设计

### 4.1 页面结构

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── data-standards/
│   │   ├── page.tsx
│   │   ├── data-elements/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── data-types/
│   │   │   └── page.tsx
│   │   └── categories/
│   │       └── page.tsx
│   ├── quality-rules/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   ├── mapping-rules/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   ├── tasks/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── my-tasks/
│   │   │   └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   ├── quality-checks/
│   │   ├── page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── issues/
│   │       └── page.tsx
│   ├── data-sources/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   ├── sync-tasks/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── records/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── create/
│   │       └── page.tsx
│   └── system/
│       ├── users/
│       │   └── page.tsx
│       ├── roles/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
└── api/
    └── v1/
        ├── auth/
        ├── data-elements/
        ├── quality-rules/
        ├── mapping-rules/
        ├── tasks/
        ├── quality-checks/
        ├── external-data-sources/
        └── sync-tasks/
```

### 4.2 组件设计

#### 通用组件

| 组件 | 路径 | 说明 |
|------|------|------|
| PageLayout | components/layout/PageLayout | 页面布局 |
| Header | components/layout/Header | 顶部导航 |
| Sidebar | components/layout/Sidebar | 侧边栏 |
| DataTable | components/common/DataTable | 数据表格 |
| SearchForm | components/common/SearchForm | 搜索表单 |
| ModalForm | components/common/ModalForm | 模态框表单 |
| StatusBadge | components/common/StatusBadge | 状态标签 |
| ActionButtons | components/common/ActionButtons | 操作按钮组 |

#### 业务组件

| 组件 | 路径 | 说明 |
|------|------|------|
| DataElementForm | components/data-standards/DataElementForm | 数据元表单 |
| QualityRuleForm | components/quality-rules/QualityRuleForm | 质量规则表单 |
| MappingRuleForm | components/mapping-rules/MappingRuleForm | 映射规则表单 |
| TaskForm | components/tasks/TaskForm | 任务表单 |
| TaskTimeline | components/tasks/TaskTimeline | 任务时间线 |
| QualityReport | components/quality-checks/QualityReport | 质量报告 |
| QualityChart | components/quality-checks/QualityChart | 质量图表 |
| DataSourceForm | components/data-sources/DataSourceForm | 数据源表单 |
| SyncTaskForm | components/sync-tasks/SyncTaskForm | 同步任务表单 |
| SyncProgress | components/sync-tasks/SyncProgress | 同步进度显示 |
| SyncRecordList | components/sync-tasks/SyncRecordList | 同步记录列表 |

### 4.3 状态管理

使用Zustand进行状态管理：

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

// stores/taskStore.ts
interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  fetchTasks: (params: QueryParams) => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<void>;
  updateTask: (id: number, data: UpdateTaskRequest) => Promise<void>;
}
```

### 4.4 UI设计规范

#### 主题配置

```typescript
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    borderRadius: 6,
    fontSize: 14,
  },
};
```

#### 布局规范

| 页面类型 | 布局 | 说明 |
|----------|------|------|
| 列表页 | 顶部搜索栏 + 数据表格 + 分页 | 标准列表页 |
| 详情页 | 面包屑 + 详情卡片 + 关联数据 | 详情展示页 |
| 表单页 | 面包屑 + 表单卡片 | 创建/编辑页 |
| 仪表盘 | 统计卡片 + 图表 | 数据展示页 |

## 5. API设计

### 5.1 API路由结构

```
/api/v1/
├── auth/
│   ├── POST /login
│   └── POST /logout
├── users/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── data-elements/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── GET /:id/versions
├── quality-rules/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/test
├── mapping-rules/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/test
├── tasks/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── POST /:id/assign
│   ├── POST /:id/accept
│   ├── POST /:id/execute
│   ├── POST /:id/submit
│   └── POST /:id/review
├── quality-checks/
│   ├── POST /
│   ├── GET /reports
│   ├── GET /reports/:id
│   └── GET /issues
├── external-data-sources/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   └── POST /:id/test
└── sync-tasks/
    ├── GET /
    ├── POST /
    ├── GET /:id
    ├── PUT /:id
    ├── DELETE /:id
    ├── POST /:id/execute
    └── GET /:id/records
```

### 5.2 API响应格式

```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 5.3 API实现示例

```typescript
// app/api/v1/data-elements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDataElements, createDataElement } from '@/services/dataElementService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    const result = await getDataElements({ page, pageSize });
    
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      message: error.message,
      data: null,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createDataElement(body);
    
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      message: error.message,
      data: null,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
```

## 6. 数据同步服务

### 6.1 同步服务架构

```mermaid
flowchart TD
    subgraph sync_scheduler[同步调度器]
        cron[Cron定时任务调度]
    end

    subgraph sync_executor[同步执行器]
        fetch[1. 获取待执行的同步任务]
        connect[2. 连接外部数据源]
        pull[3. 拉取数据\n数据元/质量规则/映射规则]
        transform[4. 数据转换和映射]
        write[5. 写入DGMP数据库]
        log[6. 记录同步日志]
    end

    subgraph sync_recorder[同步记录器]
        start_time[记录同步开始时间]
        status[记录同步状态]
        counts[记录成功/失败数量]
        errors[记录错误信息]
        duration[记录同步耗时]
    end

    sync_scheduler --> sync_executor
    sync_executor --> sync_recorder
    
    fetch --> connect
    connect --> pull
    pull --> transform
    transform --> write
    write --> log
```

### 6.2 同步流程

1. **任务调度**：Cron定时器检查待执行的同步任务
2. **连接建立**：根据数据源配置建立连接（数据库/API/文件）
3. **数据拉取**：从外部数据源拉取数据
4. **数据转换**：根据映射配置进行数据转换
5. **数据写入**：将转换后的数据写入DGMP数据库
6. **日志记录**：记录同步过程和结果
7. **通知发送**：同步完成后发送通知

### 6.3 数据源适配器

支持多种数据源类型的适配器：

| 数据源类型 | 适配器 | 说明 |
|------------|--------|------|
| MySQL | DatabaseAdapter | MySQL数据库连接和查询 |
| Oracle | DatabaseAdapter | Oracle数据库连接和查询 |
| PostgreSQL | DatabaseAdapter | PostgreSQL数据库连接和查询 |
| REST API | ApiAdapter | RESTful API调用 |
| GraphQL API | ApiAdapter | GraphQL API调用 |
| Excel | FileAdapter | Excel文件读取 |
| CSV | FileAdapter | CSV文件读取 |
| JSON | FileAdapter | JSON文件读取 |

### 6.4 同步策略

| 策略 | 说明 |
|------|------|
| 全量同步 | 每次同步拉取全部数据 |
| 增量同步 | 基于时间戳只同步变更数据 |
| 基于版本同步 | 基于版本号同步变更数据 |

### 6.5 冲突处理

| 冲突类型 | 处理策略 |
|------------|----------|
| 编码冲突 | 跳过、覆盖、重命名 |
| 数据冲突 | 跳过、覆盖、合并 |
| 版本冲突 | 保留最新版本、保留本地版本 |

## 7. 安全设计

### 7.1 认证机制

- 使用JWT进行身份认证
- Token有效期：24小时
- Refresh Token有效期：7天

```typescript
interface JwtPayload {
  userId: number;
  username: string;
  roles: string[];
  iat: number;
  exp: number;
}
```

### 7.2 权限控制

- 基于RBAC的权限控制
- 中间件验证用户权限

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const payload = verifyToken(token);
    const headers = new Headers(request.headers);
    headers.set('x-user-id', String(payload.userId));
    headers.set('x-user-roles', JSON.stringify(payload.roles));
    
    return NextResponse.next({ headers });
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 7.3 数据加密

- 密码使用bcrypt加密
- 敏感数据使用AES加密

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

const encryptData = (data: string, key: string) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};
```

### 7.4 操作审计

记录用户关键操作：

```typescript
interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  module: string;
  details: Record<string, any>;
  ip: string;
  userAgent: string;
  createdAt: Date;
}
```

## 8. 部署方案

### 8.1 Docker部署

**docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - dgmp_network

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    networks:
      - dgmp_network

  app:
    build: .
    container_name: dgmp_app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "mysql://root:root123@mysql:3306/mydb"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: "your-secret-key"
    depends_on:
      - mysql
      - redis
    networks:
      - dgmp_network

volumes:
  mysql_data:

networks:
  dgmp_network:
    driver: bridge
```

### 8.2 环境变量

```env
# Database
DATABASE_URL="mysql://root:root123@localhost:3306/mydb"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
NEXT_PUBLIC_APP_NAME="DGMP"
```

### 8.3 构建脚本

```bash
# 开发环境
npm run dev

# 生产构建
npm run build

# 生产运行
npm start

# Docker构建
docker-compose build

# Docker启动
docker-compose up -d

# Docker停止
docker-compose down
```

## 9. 开发规范

### 9.1 代码规范

- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 使用TypeScript严格模式

### 9.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | data-element-form.tsx |
| 组件名 | PascalCase | DataElementForm |
| 接口名 | PascalCase | UserData |
| 变量名 | camelCase | userName |
| 常量名 | UPPER_SNAKE_CASE | API_BASE_URL |
| 类名 | PascalCase | UserService |

### 9.3 Git提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 10. 附录

### 10.1 项目目录结构

```
DGMP/
├── app/                    # Next.js App Router
│   __ (auth)/             # 认证相关页面
│   __ (dashboard)/        # 主应用页面
│   __ api/                # API路由
│   __ layout.tsx          # 根布局
│   __ page.tsx            # 首页
├── components/             # React组件
│   __ common/             # 通用组件
│   __ layout/             # 布局组件
│   __ data-standards/     # 数据标准组件
│   __ quality-rules/      # 质量规则组件
│   __ mapping-rules/       # 映射规则组件
│   __ tasks/              # 任务组件
│   __ quality-checks/      # 质量检查组件
│   __ data-sources/       # 数据源组件
│   __ sync-tasks/         # 同步任务组件
├── lib/                   # 工具库
│   __ db.ts               # 数据库连接
│   __ auth.ts             # 认证工具
│   __ utils.ts            # 通用工具
│   __ sync/               # 同步服务
│       __ scheduler.ts     # 同步调度器
│       __ adapters/       # 数据源适配器
├── services/              # 业务服务
│   __ userService.ts
│   __ dataElementService.ts
│   __ qualityRuleService.ts
│   __ mappingRuleService.ts
│   __ taskService.ts
│   __ qualityCheckService.ts
│   __ dataSourceService.ts
│   __ syncTaskService.ts
├── stores/                # 状态管理
│   __ authStore.ts
│   __ taskStore.ts
│   __ syncStore.ts
├── types/                 # TypeScript类型定义
│   __ index.ts
│   __ api.ts
│   __ models.ts
├── prisma/                # Prisma ORM
│   __ schema.prisma
│   __ migrations/
├── public/                # 静态资源
├── docs/                  # 文档
│   __ requirements.md
│   __ design.md
├── .env.example           # 环境变量示例
├── .eslintrc.json         # ESLint配置
├── .prettierrc            # Prettier配置
├── next.config.js         # Next.js配置
├── tsconfig.json          # TypeScript配置
├── package.json           # 项目依赖
├── docker-compose.yml     # Docker配置
└── Dockerfile             # Docker镜像
```

### 10.2 版本历史

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| 1.0 | 2026-02-01 | - | 初始版本 |
