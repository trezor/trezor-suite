import z from 'zod';

import { type TorStatus } from '@suite/tor-types';
import { appsEmbeddingEntryId } from '@suite-common/apps-embedding';
import { httpsUrl } from '@suite-common/schemas/src/general/url';

import { LEGACY_ORIGIN_RECORDS_PER_MESSAGE } from './legacyOriginExportLimits';
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

// TODO: `desktop-app-api` does not depend on `desktop-app-main`, but it could reuse many of its types.
export type Status = {
    service: boolean;
    process: boolean;
};

// todo: duplicate, see prev comment
export type BridgeSettings = {
    doNotStartOnStartup: boolean;
    /**
     * Which usb library the bundled node-bridge uses. Read at bridge cold-start; a change applies
     * on the next app launch. Undefined = 'legacy' (the safe default). Desktop-only.
     */
    usbImplementation?: 'legacy' | 'nusb';
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
    connectionId?: string;
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
    connectionId: string;
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

/**
 * A catalog entry is named, never described: the host resolves its page and both of its navigation
 * allowlists from the catalog, so that the session an entry keeps on disk only ever runs the site
 * the catalog assigned to it, within the limits the catalog gave it.
 */
const inAppBrowserOpenCatalogEntryPayload = z.strictObject({
    kind: z.literal('catalog-entry'),
    entryId: appsEmbeddingEntryId,

    /**
     * The locale Suite runs in, e.g. `cs-CZ`, for an entry whose page depends on it. Held to the
     * shape of Suite's own locale tags: the catalog looks it up by key and falls back for a tag it
     * does not know.
     */
    locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
});

/**
 * Only for demo purposes. Prod. code will pass solely a catalog entry, no custom URLs are going to
 * be allowed. A custom url declares nothing: it opens in the shared in-memory session and may
 * neither leave its origin nor open a window.
 */
const inAppBrowserOpenCustomUrlPayload = z.strictObject({
    kind: z.literal('custom-url'),
    url: httpsUrl,
});

export const inAppBrowserOpenPayload = z.discriminatedUnion('kind', [
    inAppBrowserOpenCatalogEntryPayload,
    inAppBrowserOpenCustomUrlPayload,
]);

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
    // Without a url when the host refused the request before it had a page to open — a catalog
    // entry it does not know.
    | { type: 'load-failed'; url?: string; error: string }
    // Spelled out rather than imported from `@suite-common/apps-embedding`, like the rest of this
    // union. The renderer maps one onto the other, so a member added here and not there stops
    // compiling at that mapping.
    | {
          type: 'window-open-attempt';
          url: string;
          outcome: 'denied' | 'opened-in-app';
      }
    | { type: 'navigation-blocked'; url: string };

/**
 * Browser storage of the renderer's legacy `file://` origin, moved once into the origin the
 * renderer loads from now (see desktop-app-main's legacy-origin-storage module). The shapes mirror
 * the IndexedDB and File System APIs so the data can be recreated exactly: records and file
 * contents pass through IPC by structured clone, untouched.
 * The schemas also refuse the key paths, keys and file names that IndexedDB or the file system would refuse,
 * so a bad export fails in the main process instead of half-way through the import.
 */

/** An identifier as ECMAScript defines it, the unit of an IndexedDB key path. */
const IDENTIFIER = '[\\p{ID_Start}$_][\\p{ID_Continue}$\\u200C\\u200D]*';
const KEY_PATH_STRING = new RegExp(`^(?:${IDENTIFIER}(?:\\.${IDENTIFIER})*)?$`, 'u');

/** A key path: identifiers joined by periods, the empty string, or a non-empty list of those. */
const legacyOriginKeyPath = z.union([
    z.string().regex(KEY_PATH_STRING),
    z.array(z.string().regex(KEY_PATH_STRING)).min(1),
]);

const hasUniqueNames = (names: string[]) => new Set(names).size === names.length;

export const legacyOriginIndexDefinition = z
    .strictObject({
        name: z.string(),
        keyPath: legacyOriginKeyPath,
        unique: z.boolean(),
        multiEntry: z.boolean(),
    })
    .refine(index => !index.multiEntry || !Array.isArray(index.keyPath), {
        message: 'A multi-entry index cannot have an array key path',
    });

export type LegacyOriginIndexDefinition = z.infer<typeof legacyOriginIndexDefinition>;

export const legacyOriginObjectStoreDefinition = z
    .strictObject({
        name: z.string(),
        // `null` for stores with out-of-line keys, which the records then carry explicitly.
        keyPath: z.union([legacyOriginKeyPath, z.null()]),
        autoIncrement: z.boolean(),
        indexes: z.array(legacyOriginIndexDefinition),
    })
    .refine(
        store =>
            !store.autoIncrement ||
            store.keyPath === null ||
            (typeof store.keyPath === 'string' && store.keyPath !== ''),
        {
            message:
                'An auto-increment store needs out-of-line keys or a single non-empty key path',
        },
    )
    .refine(store => hasUniqueNames(store.indexes.map(index => index.name)), {
        message: 'The indexes of a store must have unique names',
    });

export type LegacyOriginObjectStoreDefinition = z.infer<typeof legacyOriginObjectStoreDefinition>;

export const legacyOriginDatabaseDefinition = z.strictObject({
    name: z.string().min(1),
    version: z.int().positive(),
});

export type LegacyOriginDatabaseDefinition = z.infer<typeof legacyOriginDatabaseDefinition>;

/** A valid IndexedDB key, which every record of the legacy origin was stored under. */
export type LegacyOriginKey =
    number | string | Date | ArrayBuffer | ArrayBufferView | LegacyOriginKey[];

export const legacyOriginKey: z.ZodType<LegacyOriginKey> = z.lazy(() =>
    z.union([
        // Unlike `z.number()`, it accepts the infinities: they are valid keys, only NaN is not.
        z.custom<number>(value => typeof value === 'number' && !Number.isNaN(value)),
        z.string(),
        z.date(),
        z.instanceof(ArrayBuffer),
        z.custom<ArrayBufferView>(value => ArrayBuffer.isView(value)),
        z.array(legacyOriginKey),
    ]),
);

export const legacyOriginRecord = z.strictObject({
    key: legacyOriginKey,
    value: z.unknown(),
});

export type LegacyOriginRecord = z.infer<typeof legacyOriginRecord>;

export type LegacyOriginObjectStore = LegacyOriginObjectStoreDefinition & {
    records: LegacyOriginRecord[];
};

export type LegacyOriginDatabase = LegacyOriginDatabaseDefinition & {
    objectStores: LegacyOriginObjectStore[];
};

/** A name the origin private file system accepts for a file or a directory. */
const legacyOriginFileName = z
    .string()
    .min(1)
    .refine(name => name !== '.' && name !== '..' && !name.includes('/'), {
        message: 'Not a valid file name',
    });

/** A file of the origin private file system, with its path from the root directory. */
export const legacyOriginFile = z.strictObject({
    path: z.array(legacyOriginFileName).min(1),
    content: z.instanceof(ArrayBuffer),
});

export type LegacyOriginFile = z.infer<typeof legacyOriginFile>;

export type LegacyOriginStorage = {
    databases: LegacyOriginDatabase[];
    localStorage: Record<string, string>;
    files: LegacyOriginFile[];
};

export const legacyOriginStorageImportReport = z.discriminatedUnion('success', [
    z.strictObject({
        success: z.literal(true),
        /** False when the renderer origin already had the database, so nothing was written. */
        isImported: z.boolean(),
    }),
    z.strictObject({ success: z.literal(false), error: z.string() }),
]);

export type LegacyOriginStorageImportReport = z.infer<typeof legacyOriginStorageImportReport>;

/**
 * Messages of the export page's preload to the main process, one object store (in slices of records) or file at a time,
 * which bounds the size of each message the page sends.
 * The main process hands the export to the renderer whole all the same:
 * the renderer writes each database inside the single versionchange transaction that creates it,
 * so it needs all of a database's records at once.
 */
export const legacyOriginExportObjectStoreMessage = z.strictObject({
    database: legacyOriginDatabaseDefinition,
    objectStore: legacyOriginObjectStoreDefinition,
    records: z.array(legacyOriginRecord).max(LEGACY_ORIGIN_RECORDS_PER_MESSAGE),
});

export type LegacyOriginExportObjectStoreMessage = z.infer<
    typeof legacyOriginExportObjectStoreMessage
>;

export const legacyOriginExportFinishedMessage = z.strictObject({
    databases: z
        .array(
            legacyOriginDatabaseDefinition.safeExtend({
                objectStoreNames: z.array(z.string()).refine(hasUniqueNames, {
                    message: 'The object stores of a database must have unique names',
                }),
            }),
        )
        .refine(databases => hasUniqueNames(databases.map(database => database.name)), {
            message: 'The databases must have unique names',
        }),
    localStorage: z.record(z.string(), z.string()),
});

export type LegacyOriginExportFinishedMessage = z.infer<typeof legacyOriginExportFinishedMessage>;

export const legacyOriginExportFailedMessage = z.strictObject({
    error: z.string(),
});

export type LegacyOriginExportFailedMessage = z.infer<typeof legacyOriginExportFailedMessage>;
