export interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    torDataDir: string;
}

export type TorCommandResponse =
    | {
          success: true;
          payload: string;
      }
    | {
          success: false;
          payload: string;
      };

export type BootstrapEvent =
    | {
          type: 'slow';
      }
    | {
          type: 'progress';
          progress: string;
          summary?: string;
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
          statusCode: number | undefined;
      }
    | {
          type: 'NETWORK_MISBEHAVING';
      }
    | {
          type: 'ERROR';
          error: Error;
      };

export type TorSettings = {
    host?: string;
    port?: number;
    running: boolean;
};

export type InterceptorOptions = {
    handler: (event: InterceptedEvent) => void;
    getTorSettings: () => TorSettings;
    allowTorBypass?: boolean;
    whitelistedHosts?: string[];
};

export const TOR_CONTROLLER_STATUS = {
    Bootstrapping: 'Bootstrapping',
    Stopped: 'Stopped',
    CircuitEstablished: 'CircuitEstablished',
} as const;
export type TorControllerStatus = keyof typeof TOR_CONTROLLER_STATUS;
