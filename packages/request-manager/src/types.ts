export interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    torDataDir: string;
}

export interface TorExternalConnectionOptions {
    host: string;
    port: number;
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
          type: 'INTERCEPTED_HEADERS';
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
          type: 'CIRCUIT_MISBEHAVING';
          identity?: string;
      }
    | {
          type: 'ERROR';
          error: Error;
      }
    | {
          type: 'SET_WHITELISTED_DOMAINS_FOR_CUSTOM_BACKENDS';
          coin: string;
          domains: string[];
      }
    | {
          type: 'ADD_WHITELISTED_DOMAIN';
          domain: string;
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
    notRequiredTorDomainsList?: string[];
    getWhitelistedDomains: () => string[];
};

export const TOR_CONTROLLER_STATUS = {
    Bootstrapping: 'Bootstrapping',
    Stopped: 'Stopped',
    CircuitEstablished: 'CircuitEstablished',
    ExternalTorRunning: 'ExternalTorRunning',
} as const;
export type TorControllerStatus = keyof typeof TOR_CONTROLLER_STATUS;
