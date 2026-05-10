// Gateway Client — wraps the Remote Agent Gateway HTTP API so the mobile
// ACP UI can spawn agents on remote nodes and then connect to them over
// the returned WebSocket endpoint.
//
// This module is intentionally self-contained and has no dependency on the
// ACP SDK or Vue stores, so it can be tested independently.

export interface GatewayAgentConfig {
  transport: 'gateway';
  /** Gateway base URL, e.g. "https://gateway.example.com" or "http://192.168.1.10:8080" */
  gatewayUrl: string;
  /** User authentication token (JWT / Bearer). Stored in config — treat as sensitive. */
  userToken: string;
  /** Default node to spawn agents on. Can be overridden per-session. */
  defaultNodeId?: string;
  /** Default working directory. Can be overridden per-session. */
  defaultDirectory?: string;
}

export interface SpawnRequest {
  nodeId: string;
  directory: string;
  env?: Record<string, string>;
  timeoutMinutes?: number;
}

export interface SpawnResponse {
  sessionId: string;
  endpoint: string;
  reconnectToken: string;
  nodeId: string;
  status: string;
  createdAt: string;
}

export interface SessionStatusResponse {
  sessionId: string;
  nodeId: string;
  directory: string;
  status: string;
  createdAt: string;
}

export class GatewayClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const resp = await fetch(url, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Gateway ${resp.status}: ${text}`);
    }
    if (resp.status === 204) {
      return undefined as unknown as T;
    }
    return resp.json() as Promise<T>;
  }

  async spawn(req: SpawnRequest): Promise<SpawnResponse> {
    return this.request<SpawnResponse>('POST', '/api/v1/agents/spawn', {
      node_id: req.nodeId,
      directory: req.directory,
      env: req.env ?? {},
      timeout_minutes: req.timeoutMinutes ?? 60,
    });
  }

  async destroy(sessionId: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/agents/${sessionId}`);
  }

  async status(sessionId: string): Promise<SessionStatusResponse> {
    return this.request<SessionStatusResponse>('GET', `/api/v1/agents/${sessionId}/status`);
  }
}

/** Build a websocket AgentConfig from a Gateway spawn response so it can be
 *  fed straight into `createAcpClient`. */
export function spawnResponseToAgentConfig(resp: SpawnResponse): {
  transport: 'websocket';
  url: string;
  headers: Record<string, string>;
} {
  return {
    transport: 'websocket',
    url: resp.endpoint,
    headers: {},
  };
}
