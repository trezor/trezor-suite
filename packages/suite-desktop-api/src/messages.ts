import { ExtractUndefined } from './methods';

export type SuiteThemeVariant = 'light' | 'dark' | 'system';

export const TOR_STATUS_EVENT_TYPE = {
    Enabled: 'Enabled',
    Disabled: 'Disabled',
    Misbehaving: 'Misbehaving',
    Error: 'Error',
} as const;
type TorStatusEventType = keyof typeof TOR_STATUS_EVENT_TYPE;
export type TorStatusEvent =
    | {
          type: Exclude<TorStatusEventType, 'Error'>;
      }
    | {
          type: Exclude<TorStatusEventType, 'Enabled' | 'Disabled' | 'Misbehaving'>;
          message: string;
      };

export type BootstrapTorEvent =
    | {
          type: 'progress';
          summary: string;
          progress: {
              current: number;
              total: number;
          };
      }
    | {
          type: 'error';
          message: string;
      };

export type HandshakeEvent =
    | {
          type: 'progress';
          message?: string;
          progress: {
              current: number;
              total: number;
          };
      }
    | {
          type: 'message';
          message: string;
      }
    | {
          type: 'error';
          message: string;
      };

export type HandshakeClient = any;

export type HandshakeTorModule = {
    shouldRunTor: boolean;
};

export type HandshakeElectron = {
    protocol?: string;
    desktopUpdate?: {
        allowPrerelease: boolean;
        firstRun?: string;
    };
    paths: {
        userDir: string;
        binDir: string;
    };
    urls: {
        httpReceiver: string;
    };
};

export interface UpdateInfo {
    version: string;
    releaseDate: string;
    isManualCheck?: boolean;
    downloadedFile?: string;
    prerelease?: boolean;
    changelog?: string;
}

export type UpdateProgress = Partial<{
    total: number;
    delta: number;
    transferred: number;
    percent: number;
    bytesPerSecond: number;
    verifying: boolean;
}>;

export type InvokeResult<Payload = undefined> = ExtractUndefined<Payload> extends undefined
    ? { success: true; payload?: Payload } | { success: false; error: string; code?: string }
    : { success: true; payload: Payload } | { success: false; error: string; code?: string };
