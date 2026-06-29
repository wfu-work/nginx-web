# Nginx Control Web

Nginx Control Web 是一个基于 Angular 的 Nginx 可视化运维前端，配套 `nginx-go` 后端使用。它面向私有化部署场景，提供多节点 Nginx 管理、配置发布、日志审计、指标观测和事件通知等能力。

项目希望把日常 Nginx 运维从“手动 SSH + 编辑配置 + reload”收敛到一个可视化、可审计、可回滚的控制台中。

## 功能特性

- **运行总览**：查看实例状态、进程、版本、连接数、请求数和最近操作。
- **节点管理**：查看本机/Agent 节点，管理 Agent ID、地址、标签、在线状态和最后心跳。
- **实例管理**：支持 command、systemd、Docker 三种运行模式，可绑定本机或远程 Agent 节点。
- **站点配置**：管理 server block、域名、监听端口、root、HTTPS、证书和 location 规则。
- **上游服务**：管理 upstream group 和 upstream server，支持健康检查。
- **证书管理**：维护证书路径、私钥路径、域名、签发者和有效期元数据。
- **配置发布**：支持配置生成、语法校验、版本保存、diff、发布、reload 和回滚。
- **日志与审计**：查看 access/error log，解析结构化日志，查看操作审计记录。
- **事件通知**：顶部通知中心接收后端事件，支持 WebSocket 推送。
- **运行时设置**：维护后端 key-value 配置，例如 `nginx.stub-status-url`。

## 技术栈

- Angular `21.x`
- ng-alain / @delon `21.x`
- NG-ZORRO `21.x`
- RxJS `7.x`
- Less
- TypeScript `5.9.x`

## 项目结构

```text
src/
  app/
    core/net/                 # HTTP 拦截器，拼接 environment.api.baseUrl
    layout/basic/             # 主布局、侧边菜单、顶部栏
    routes/
      nginx/                  # Nginx 控制台页面、API service 和路由
      guide/                  # 使用指南
      passport/               # 登录 / 注册相关页面
    shared/                   # 通用组件、Zorro/Delon 共享模块
  environments/               # API baseUrl、hash 路由等环境配置
proxy.conf.js                 # 本地开发代理
```

Nginx 控制台核心文件：

```text
src/app/routes/nginx/nginx-console.component.ts
src/app/routes/nginx/nginx-console.component.html
src/app/routes/nginx/nginx-console.component.less
src/app/routes/nginx/nginx-api.service.ts
```

## 环境要求

- Node.js：建议使用 Angular 21 支持的 LTS 版本。
- npm：项目默认使用 npm 脚本。
- 后端：启动同级项目 `nginx-go`，默认地址为 `http://127.0.0.1:3007/api`。

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm start
```

默认执行 `ng s -o`，浏览器会自动打开本地开发页面。

构建生产产物：

```bash
npm run build
```

构建输出目录：

```text
dist/nginx-web
```

## 本地代理

开发环境通过 [proxy.conf.js](./proxy.conf.js) 转发后端请求：

```text
/api/    -> http://127.0.0.1:3007/api/
/api/ws  -> http://127.0.0.1:3007/api/ws
/dev/    -> http://127.0.0.1:3007/api/
/dev/ws  -> http://127.0.0.1:3007/api/ws
```

前端代码使用相对路径调用接口。HTTP 拦截器会基于 `environment.api.baseUrl` 拼接统一前缀，开发代理再转发到后端。

## 常用脚本

```bash
npm start          # 本地开发，打开浏览器
npm run build      # 生产构建
npm run watch      # development 配置下 watch 构建
npm test           # 单元测试
npm run lint       # TypeScript + Less lint
npm run analyze    # 构建 source map
npm run theme      # 生成主题 CSS
npm run color-less # 生成主题 Less 变量
```

## 页面路由

```text
/nginx/dashboard     运行总览
/nginx/nodes         节点管理
/nginx/instances     实例管理
/nginx/sites         站点配置
/nginx/upstreams     上游服务
/nginx/certificates  证书管理
/nginx/configs       配置发布
/nginx/logs          日志与审计
/nginx/settings      运行时设置
/guide               使用指南
```

## 多节点使用方式

前端已支持后端的“中心端 + Agent”模式：

1. 在后端 `config.yaml` 配置 `agent.shared-token`。
2. 在每台 Nginx 服务器运行 `nginx-go/cmd/nginx-agent`。
3. Agent 注册成功后，进入 `/nginx/nodes` 查看节点状态。
4. 进入 `/nginx/instances`，将实例的“运行节点”绑定到对应节点。
5. 后续状态查询、日志读取、配置发布和 reload 会由后端转发给目标 Agent 执行。

Agent 启动示例：

```bash
go run ./cmd/nginx-agent \
  -center http://CENTER_HOST:3007/api \
  -token your-token \
  -agent-id prod-nginx-01 \
  -name 生产-Nginx-01
```

## 后端接口分组

前端 API 封装位于 [nginx-api.service.ts](./src/app/routes/nginx/nginx-api.service.ts)。

主要接口分组：

- `/nodes/*`：节点 CRUD。
- `/nginx/*`：实例状态、操作、操作记录、实例 CRUD。
- `/metrics/*`：运行指标和 `stub_status` 汇总。
- `/sites/*`：站点 CRUD、启停、location CRUD。
- `/upstreams/*`：上游组 CRUD、上游节点 CRUD、健康检查。
- `/certificates/*`：证书 CRUD。
- `/configs/*`：配置生成、校验、发布、回滚、diff、版本历史、发布任务。
- `/logs/*`：raw 日志、结构化日志、日志同步、审计记录。
- `/events/*`：通知列表、已读状态、SSE/WebSocket。
- `/settings/*`：运行时设置。

## 部署说明

生产环境配置位于：

```text
src/environments/environment.prod.ts
```

默认 API 配置：

```ts
api: {
  baseUrl: '/api',
  refreshTokenEnabled: false,
  refreshTokenType: 'auth-refresh',
}
```

部署时需要确保静态站点所在 Nginx、网关或反向代理能把 `/api` 转发到 `nginx-go` 后端，并正确代理 WebSocket 路径 `/api/ws`。

## 开发约定

- 新增后端接口时，优先在 `nginx-api.service.ts` 补齐类型和方法。
- 危险操作必须加二次确认，例如删除、停止、重启、发布、回滚。
- 表单必填项需配置 Angular validators，并在提交时触发表单校验。
- 配置发布相关操作优先使用实例、站点、版本选择器，避免手填 GUID。
- UI 保持运维控制台风格：浅色背景、清晰表格、紧凑表单、明确状态标识。

## 故障排查

### 请求 404

- 确认 `nginx-go` 已启动。
- 确认后端监听地址为 `127.0.0.1:3007`。
- 确认 `proxy.conf.js` 中 `/api/` 的 target 与后端一致。
- 确认浏览器请求路径是否以 `/api` 开头。

### WebSocket 无通知

- 确认后端 `/api/ws` 可访问。
- 确认开发代理或生产网关启用了 WebSocket 转发。
- 确认浏览器控制台没有认证或跨域错误。

### 节点一直离线

- 确认 Agent 已启动并能访问中心端 `/api/agent/register`。
- 确认 Agent 请求头中的 `X-Agent-Token` 与后端 `agent.shared-token` 一致。
- 确认节点没有被禁用。
- 确认实例已绑定正确的 `nodeGuid`。

### `stub_status` 指标为空

- 确认实例或运行时设置中配置了 `stubStatusUrl`。
- 确认 Nginx 已开放 `stub_status` location。
- 本机模式下，后端服务器需要能访问该 URL。
- Agent 模式下，Agent 所在服务器需要能访问该 URL。

### 发布成功但 Nginx 未生效

- 确认实例的 `managedConfig` 是 Nginx 实际 include 的配置文件。
- 确认发布任务中的 `targetPath` 符合预期。
- 确认 `nginx -t` 输出成功。
- 确认 reload 操作记录成功。

## 当前限制

- Nginx 控制台目前仍由单页面组件承载多个 section，后续功能继续扩展时建议拆分为子组件。
- 日志表当前只展示最近分页数据，复杂筛选能力还可以继续增强。
- 证书管理维护的是证书路径和元数据，不负责签发或自动续期执行。
- Docker 模式依赖后端或 Agent 所在机器具备 Docker CLI 能力。
- Agent 当前采用轮询任务模型，适合内网和中小规模部署；大规模场景可演进为 gRPC/WebSocket 长连接。

## 贡献指南

欢迎提交 Issue 和 Pull Request。建议在提交前执行：

```bash
npm run build
npm run lint
```

如果改动涉及界面交互，请在 PR 中说明：

- 修改的页面或流程。
- 对应后端接口。
- 验证方式。
- 可能影响的部署配置。

## 许可证

当前仓库包含 `LICENSE` 文件，请以仓库实际许可证为准。
