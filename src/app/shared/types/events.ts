export type WebSocketEventType =
  | 'metrics'
  | 'nginx.status'
  | 'nginx.operation'
  | 'config.publish'
  | 'upstream.health'
  | 'error'
  | string;

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  data: T;
  time?: number;
}

export interface EventNotification {
  guid: string;
  title: string;
  content: string;
  level: 'info' | 'warning' | 'error' | string;
  read: boolean | number;
  eventTime?: number;
  sourceType?: string;
  sourceGuid?: string;
  createTime?: number;
  updateTime?: number;
}
