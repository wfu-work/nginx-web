import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SHARED_IMPORTS, TitleLabelComponent } from '@shared';

interface GuideStep {
  title: string;
  desc: string;
  path?: string;
  action?: string;
  fields: string[];
}

interface AgentDownloadItem {
  platform: string;
  arch: string;
  label: string;
}

interface AgentFlag {
  flag: string;
  desc: string;
}

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SHARED_IMPORTS, TitleLabelComponent],
})
export class GuideComponent {
  protected readonly agentOnlineCommand = `curl -fsSL http://CENTER_HOST:3007/api/downloads/install-agent.sh | sudo sh -s -- \\
  --center http://CENTER_HOST:3007/api \\
  --token your-token \\
  --agent-id prod-nginx-01 \\
  --name "生产 Nginx 01" \\
  --address 10.0.0.12 \\
  --labels env=prod,region=cn`;

  protected readonly agentManualCommand = `GOOS=linux GOARCH=amd64 go build -o nginx-agent ./cmd/nginx-agent
sudo install -m 0755 nginx-agent /usr/local/bin/nginx-agent

sudo tee /etc/systemd/system/nginx-agent.service >/dev/null <<'EOF'
[Unit]
Description=Nginx Agent
After=network-online.target

[Service]
ExecStart=/usr/local/bin/nginx-agent -center http://CENTER_HOST:3007/api -token your-token -agent-id prod-nginx-01 -name "生产 Nginx 01" -address 10.0.0.12 -labels env=prod,region=cn
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now nginx-agent
sudo systemctl status nginx-agent`;

  protected readonly agentDirectCommand = `nginx-agent -center http://CENTER_HOST:3007/api \\
  -token your-token \\
  -agent-id prod-nginx-01 \\
  -name "生产 Nginx 01" \\
  -address 10.0.0.12 \\
  -labels env=prod,region=cn`;

  protected readonly agentDownloads: AgentDownloadItem[] = [
    { platform: 'linux', arch: 'amd64', label: 'Linux x86_64' },
    { platform: 'linux', arch: 'arm64', label: 'Linux ARM64' },
    { platform: 'darwin', arch: 'arm64', label: 'macOS ARM64' },
    { platform: 'windows', arch: 'amd64', label: 'Windows x86_64' },
  ];

  protected readonly agentFlags: AgentFlag[] = [
    { flag: '-center', desc: '中心端 API 地址，必须包含 /api 前缀' },
    { flag: '-token', desc: '后端 config.yaml 中的 agent.shared-token' },
    { flag: '-agent-id', desc: '稳定节点标识，建议按环境和机器命名' },
    { flag: '-name', desc: '节点显示名称，会出现在节点管理列表' },
    { flag: '-address', desc: '节点 IP 或主机名，便于运维定位' },
    { flag: '-labels', desc: '逗号分隔标签，例如 env=prod,region=cn' },
  ];

  protected readonly agentFiles = [
    '/usr/local/bin/nginx-agent',
    '/etc/systemd/system/nginx-agent.service',
    'agent.shared-token',
    '/nginx/nodes',
  ];

  protected readonly steps: GuideStep[] = [
    {
      title: '接入 Agent 节点',
      desc: '先在 Nginx 服务器部署 Agent，节点注册和心跳会自动进入控制台，命令、日志和发布都按节点转发。',
      path: '/nginx/nodes',
      action: '查看节点',
      fields: ['agentId', 'status', 'version', 'labels', 'lastSeenAt'],
    },
    {
      title: '建立站点',
      desc: '录入 server_name、listen、root、证书和 location 规则，后端会基于结构化数据生成 nginx 配置。',
      path: '/nginx/sites',
      action: '管理站点',
      fields: ['serverName', 'listen', 'ssl', 'proxyPass', 'extraConfig'],
    },
    {
      title: '配置上游',
      desc: '创建 upstream 和 server 节点后可直接做 TCP 健康检查，作为反向代理的目标池。',
      path: '/nginx/upstreams',
      action: '管理上游',
      fields: ['name', 'method', 'address', 'weight', 'failTimeout'],
    },
    {
      title: '预览与校验',
      desc: '发布前先生成配置预览，再调用后端 nginx -t 校验，失败时不会覆盖现有配置。',
      path: '/configs/preview',
      action: '配置发布',
      fields: ['render', 'validate', 'version', 'nginx -t'],
    },
    {
      title: '发布与回滚',
      desc: '发布会原子写入托管配置并 reload；历史版本可回滚，回滚同样会经过确认和 reload。',
      path: '/configs/versions',
      action: '查看版本',
      fields: ['publish', 'rollback', 'backupPath', 'operationGuid'],
    },
    {
      title: '审计追踪',
      desc: '工作台查看运行状态、进程和最近操作；审计记录用于追踪发布、回滚和高危运行操作。',
      path: '/audit',
      action: '查看审计',
      fields: ['operation', 'publish', 'rollback', 'reason'],
    },
  ];

  protected readonly checks = [
    '前端不会接收任意 shell 命令，启停、重启、reload 都走后端白名单。',
    'reload 前后端会先执行 nginx -t，校验失败不会发布。',
    'stop、restart、rollback 属于高危操作，后端要求 confirm=true 并记录审计。',
    '生产环境建议使用独立 managedConfig 文件，并在 nginx.conf 中 include 该文件。',
    'Agent 负责上报节点状态并轮询任务，中心端不需要直接 SSH 到业务服务器。',
    'stub_status URL 为空时不影响工作台运行，但连接数和请求量会显示为空。',
  ];

  protected agentDownloadHref(item: AgentDownloadItem): string {
    return `/api/downloads/nginx-agent?os=${item.platform}&arch=${item.arch}`;
  }
}
