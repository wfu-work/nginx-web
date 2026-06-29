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

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SHARED_IMPORTS, TitleLabelComponent],
})
export class GuideComponent {
  protected readonly steps: GuideStep[] = [
    {
      title: '确认实例',
      desc: '先配置本机 command、systemd 或 Docker 实例，所有命令和日志路径都来自后端实例配置。',
      path: '/nginx/instances',
      action: '配置实例',
      fields: ['mode', 'bin', 'mainConfig', 'managedConfig', 'dockerContainer'],
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
      path: '/nginx/configs',
      action: '配置发布',
      fields: ['render', 'validate', 'version', 'nginx -t'],
    },
    {
      title: '发布与回滚',
      desc: '发布会原子写入托管配置并 reload；历史版本可回滚，回滚同样会经过确认和 reload。',
      path: '/nginx/configs',
      action: '查看版本',
      fields: ['publish', 'rollback', 'backupPath', 'operationGuid'],
    },
    {
      title: '观测与审计',
      desc: '工作台查看进程、stub_status 和操作记录；日志页可 tail 文件、同步结构化日志、查看审计。',
      path: '/nginx/logs',
      action: '查看日志',
      fields: ['access.log', 'error.log', 'audit', 'MetricSample'],
    },
  ];

  protected readonly checks = [
    '前端不会接收任意 shell 命令，启停、重启、reload 都走后端白名单。',
    'reload 前后端会先执行 nginx -t，校验失败不会发布。',
    'stop、restart、rollback 属于高危操作，后端要求 confirm=true 并记录审计。',
    '生产环境建议使用独立 managedConfig 文件，并在 nginx.conf 中 include 该文件。',
    'Docker 模式第一版使用 Docker CLI 白名单调用，后续可替换为 Docker API client。',
    'stub_status URL 为空时不影响工作台运行，但连接数和请求量会显示为空。',
  ];
}
