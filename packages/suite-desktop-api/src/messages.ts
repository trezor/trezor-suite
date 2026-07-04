import { type TorStatus } from '@suite/tor';

import { type ExtractUndefined } from './methods';

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

export type HandshakeClient = {
    legacyBioAuthEnabled: boolean;
};

export type HandshakeInit = {
    statePatch?: Record<string, any>;
};

export type HandshakeTorModule = {
    shouldRunTor: boolean;
};

export type TorSettings = {
    useExternalTor: boolean;
    externalPort: number;
};

export type MoneroNetwork = 'mainnet' | 'stagenet';

// Lifecycle of the local Monero daemon (monerod) managed by the desktop app.
// A string union (not an enum) so it can cross the package boundary as a pure type.
export type MonerodStatus =
    | 'Disabled'
    | 'Downloading'
    | 'Starting'
    | 'Syncing'
    | 'Enabled'
    | 'Error';

export type MonerodStatusEvent = {
    type: MonerodStatus;
    message?: string;
};

// Progress of the monerod binary download (`current`/`total` in percent).
export type MonerodDownloadEvent = {
    progress: {
        current: number;
        total: number;
    };
};

// Progress of the blockchain sync once monerod is running (`current`/`total` in blocks).
export type MonerodSyncEvent = {
    height: number;
    targetHeight: number;
    progress: {
        current: number;
        total: number;
    };
};

export type MonerodSettings = {
    running: boolean;
    network: MoneroNetwork;
};

// Totem — the desktop acting as a self-hosted backend ("totem") for a tribe, reachable
// over a Tor onion service. A string union (not an enum) so it crosses the package
// boundary as a pure type.
export type TotemStatus = 'Disabled' | 'Provisioning' | 'Enabled' | 'Error';

// Per-service state shown to the keeper and reported to members through the manifest.
export type TotemServiceStatus = 'active' | 'pending' | 'non-active';

export type TotemServiceState = {
    id: string; // service identifier, e.g. 'xmr'
    virtualPort: number; // port members connect to on the .onion address
    enabled: boolean; // keeper published this service (members only see enabled ones)
    status: TotemServiceStatus;
};

export type TotemStatusEvent = {
    type: TotemStatus;
    address?: string; // <serviceId>.onion once the totem is raised
    services?: TotemServiceState[];
    message?: string;
};

export type TotemSettings = {
    running: boolean;
    provisioned: boolean; // an onion identity has been derived (Trezor-bound key present)
    address?: string;
    services: TotemServiceState[];
};

export type TotemProvisionResult = {
    address: string;
};

// Free/total bytes on the volume holding the app's data directory (generic OS query).
export type DiskSpace = {
    free: number;
    total: number;
};

export type TraySettings = {
    showOnTray: boolean;
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

export type BioAuthSettings = {
    enabled: boolean;
};

export type InvokeResult<Payload = undefined> =
    ExtractUndefined<Payload> extends undefined
        ? { success: true; payload?: Payload } | { success: false; error: string; code?: string }
        : { success: true; payload: Payload } | { success: false; error: string; code?: string };

export type ConnectPopupCall = {
    id: string;
    method: string;
    payload: any;
    sourceType?: string;
    silent?: boolean;
    process?: {
        name: string;
        warning: boolean;
        fullPath: string;
        icon?: string;
    };
    origin: string;
    manifest: {
        appName: string;
        appIcon?: string;
        appUrl: string;
        email: string;
        npmVersion?: string;
    };
};

export type ConnectPopupCancel = {
    error?: string;
    callId?: string;
};

export type ConnectPopupResponse = {
    id: string;
} & (
    | {
          success: true;
          payload: any;
      }
    | {
          success: false;
          payload: any; // for backward compatibility with v9
          error: any;
      }
);
