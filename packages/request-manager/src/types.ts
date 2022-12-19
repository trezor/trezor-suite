export interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    torDataDir: string;
}

export type BootstrapEvent = {
    progress: string | undefined;
    summary: string | undefined;
};

export type InterceptedEvent =
    | {
          type: 'INTERCEPTED_REQUEST';
          method: string;
          details: string;
      }
    | {
          type: 'INTERCEPTED_RESPONSE';
          host: string;
          time: number;
          statusCode: number;
      }
    | {
          type: 'NETWORK_MISBEHAVING';
      }
    | {
          type: 'ERROR' | 'ERROR_PROXY_TIMEOUT' | 'ERROR_PROXY_REJECTED';
      };

export type InterceptorOptions = {
    handler: (event: InterceptedEvent) => void;
    getIsTorEnabled: () => boolean;
    isDevEnv?: boolean;
};
