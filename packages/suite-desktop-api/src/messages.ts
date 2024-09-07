import { TorStatus } from './enums';
import { ExtractUndefined } from './methods';

export type SuiteThemeVariant = 'light' | 'dark' | 'system';

export type TorStatusEvent = {
    type: TorStatus;
    message?: string;
};

export type BootstrapTorEvent =
    | {
          type: 'slow';
      }
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

export type HandshakeInit = {
    statePatch?: Record<string, any>;
};

export type HandshakeTorModule = {
    shouldRunTor: boolean;
};

export type TorSettings = {
    snowflakeBinaryPath: string;
};

export type HandshakeElectron = {
    protocol?: string;
    desktopUpdate?: {
        allowPrerelease: boolean;
        isAutomaticUpdateEnabled: boolean;
        firstRun?: string; // string => contains the version of the updated Suite
    };
    paths: {
        userDir: string;
        binDir: string;
    };
    urls: {
        httpReceiver: string;
    };
};

interface LoggerOptions {
    colors?: boolean;
    writeToConsole?: boolean;
    writeToDisk?: boolean;
    outputFile?: string;
    outputPath?: string;
    logFormat?: string;
}

export interface LoggerConfig {
    level?: 'mute' | 'error' | 'warn' | 'info' | 'debug';
    options?: LoggerOptions;
}

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

// todo: suite-desktop-api does not have suite-desktop dependency but we could reuse lot of types from there I guess
export type Status = {
    service: boolean;
    process: boolean;
};

// todo: duplicate, see prev comment
export type BridgeSettings = {
    doNotStartOnStartup: boolean;
    legacy?: boolean;
    newBridgeRollout?: number;
};

export type InvokeResult<Payload = undefined> =
    ExtractUndefined<Payload> extends undefined
        ? { success: true; payload?: Payload } | { success: false; error: string; code?: string }
        : { success: true; payload: Payload } | { success: false; error: string; code?: string };
