import z from 'zod';

import { type TorStatus } from '@suite/tor-types';
import { appsEmbeddingEntryId } from '@suite-common/apps-embedding';
import { httpsUrl } from '@suite-common/schemas/src/general/url';

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

export interface LoggerConfig {
    level?: 'mute' | 'error' | 'warn' | 'info' | 'debug';
    writeToDisk?: boolean;
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

// todo: desktop-app-api does not have suite-desktop dependency but we could reuse lot of types from there I guess
export type Status = {
    service: boolean;
    process: boolean;
};

// todo: duplicate, see prev comment
export type BridgeSettings = {
    doNotStartOnStartup: boolean;
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
    // Mirrors connect's `PermissionRequest`, inlined to keep this package free of a
    // `@trezor/connect` dependency — same as `manifest` above.
    requestedPermissions?: { permission: string; coin?: string }[];
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

export const inAppBrowserBounds = z.strictObject({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
});

export type InAppBrowserBounds = z.infer<typeof inAppBrowserBounds>;

export const inAppBrowserOpenPayload = z.strictObject({
    /**
     * Only for demo purposes. Prod. code will pass solely `entryId`, no custom URLs are going to be allowed.
     */
    url: httpsUrl,
    redirectExternalOrigins: z.array(httpsUrl),
    popupExternalOrigins: z.array(httpsUrl),

    /**
     * Once we'll ditch demo, it's going to be required.
     */
    entryId: appsEmbeddingEntryId.optional(),
});

export type InAppBrowserOpenPayload = z.infer<typeof inAppBrowserOpenPayload>;

/**
 * Events forwarded from the main-process WebContentsView host
 */
export type InAppBrowserHostEvent =
    | { type: 'navigated'; url: string }
    // Not a log line but the state the in-app browser bar renders from: which history buttons are
    // live and what the address field shows. The renderer cannot derive any of it — the history
    // belongs to a WebContents it has no handle on — so the host pushes it on every navigation and
    // once when the view opens.
    | { type: 'navigation-state'; url: string; canGoBack: boolean; canGoForward: boolean }
    | { type: 'loaded'; url: string }
    | { type: 'load-failed'; url: string; error: string }
    // Spelled out rather than imported from `@suite-common/apps-embedding`, like the rest of this
    // union. The renderer maps one onto the other, so a member added here and not there stops
    // compiling at that mapping.
    | {
          type: 'window-open-attempt';
          url: string;
          outcome: 'denied' | 'opened-in-app';
      }
    | { type: 'navigation-blocked'; url: string };
