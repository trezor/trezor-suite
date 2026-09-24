import { type Session, session } from 'electron';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

import { type InvokeResult } from '@suite/desktop-app-api';
import {
    type AppsEmbeddingCatalogEntry,
    ENTRY_ID_MAX_LENGTH,
    ENTRY_ID_PATTERN,
    getAppsEmbeddingCatalogEntry,
    getPlatformSpecificEntry,
} from '@suite-common/apps-embedding';
import { type Result, err, ok } from '@trezor/type-utils';

import { resolveDirectoryInUserDataDir } from '../../../libs/user-data';
import { IN_APP_BROWSER_DIRECTORY, IN_APP_BROWSER_SESSION_PARTITION } from '../config';
import { SERVICE_NAME } from '../constants';
import { activeViewContext, inAppBrowserContext } from '../context';

/**
 * Turns an entry id into the directory that entry's session lives in.
 *
 * The failure being guarded against is not a broken feature but a second Chromium storage backend
 * pointed somewhere it must never be: `..` would land on `userData` itself, where Suite keeps its
 * own IndexedDB and cookies, and an absolute or UNC id would leave the tree altogether. `fromPath`
 * refuses neither — it only rejects a relative path and an empty string, and `path.join(base, '')`
 * is the base directory, which is absolute and would pool every entry into one session.
 *
 * Three checks, each able to fail alone. The charset is the first, and the containment check from
 * `libs/user-data` is deliberately not the last: it counts the `userData` root as contained (its
 * own unit test asserts that), so `embedded-apps/..` passes it. Only the final comparison — the
 * directory must sit exactly one segment below the embedded-apps root — refuses that.
 */
function resolveInAppBrowserSessionDir(entryId: string): Result<string, string> {
    if (entryId.length > ENTRY_ID_MAX_LENGTH || !ENTRY_ID_PATTERN.test(entryId)) {
        return err('the entry id is not usable as a directory name');
    }

    const root = resolveDirectoryInUserDataDir(IN_APP_BROWSER_DIRECTORY);
    const resolved = resolveDirectoryInUserDataDir(`${IN_APP_BROWSER_DIRECTORY}/${entryId}`);

    if (!root.success || !resolved.success) {
        return err('the session directory is outside the app data folder');
    }

    if (dirname(resolved.payload.dir) !== root.payload.dir) {
        return err('the session directory is not inside the embedded apps folder');
    }

    return ok(resolved.payload.dir);
}

/**
 * - Electron grants every permission to a session without handlers of its own,
 * which would hand the embedded page the clipboard, the camera, notifications under Suite's name and `openExternal` for
 * custom schemes.
 * - Each setter replaces the previous handler, so applying this per open never stacks.
 */
function denyAllPermissions(inAppBrowserSession: Session): void {
    inAppBrowserSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        logger.warn(SERVICE_NAME, `Denied the "${permission}" permission`);
        callback(false);
    });
    inAppBrowserSession.setPermissionCheckHandler(() => false);
    inAppBrowserSession.setDevicePermissionHandler(() => false);
}

/**
 * - Electron's default user agent adds the app name and version and an `Electron/` token to the Chrome one,
 * which tells every embedded site and tracker that the visitor runs Trezor Suite.
 * - Only those two tokens are dropped, so re-applying to an already plain user agent changes nothing.
 * - Must run before a view is created: the session's user agent does not reach existing `WebContents`.
 */
function setPlainChromeUserAgent(inAppBrowserSession: Session): void {
    const plainChromeUserAgent = inAppBrowserSession
        .getUserAgent()
        .replace(/ Electron\/\S+/, '')
        .replace(/\S+\/\S+ (?=Chrome\/)/, '');

    inAppBrowserSession.setUserAgent(plainChromeUserAgent);
}

/**
 * The session an entry's data lives in, created on first use and reused afterwards.
 *
 * The directory is created here rather than left to Chromium: `mkdir -p` is one call, and it
 * removes the question of whether `fromPath` would create a nested parent itself.
 */
export async function getPersistentSession(entryId: string): Promise<Result<Session, string>> {
    const { sessions } = await inAppBrowserContext.get();
    const cached = sessions.get(entryId);

    if (cached) {
        return ok(cached);
    }

    const dir = resolveInAppBrowserSessionDir(entryId);

    if (!dir.success) {
        logger.error(SERVICE_NAME, `Refusing a session for "${entryId}": ${dir.error}`);

        // Deliberately not the resolver's message: this one is rendered in the UI, and the
        // resolver's carries the absolute path, which carries the user's home directory.
        return err('the entry id is not usable as a directory name');
    }

    try {
        await mkdir(dir.payload, { recursive: true });
    } catch (error) {
        logger.error(SERVICE_NAME, `Cannot create ${dir.payload}: ${error}`);

        return err('the session directory could not be created');
    }

    const inAppBrowserSession = session.fromPath(dir.payload, { cache: true });

    // The whole point of this branch is a session that writes to disk, and the two ways to end
    // up with one that does not — an in-memory session, or Suite's own — are both silent.
    // `storagePath` is the documented discriminator; `isPersistent()` only describes partitions.
    if (inAppBrowserSession.storagePath === null) {
        logger.error(SERVICE_NAME, `Session for "${entryId}" has no storage path`);

        return err('the session was not created with storage');
    }

    denyAllPermissions(inAppBrowserSession);
    setPlainChromeUserAgent(inAppBrowserSession);
    sessions.set(entryId, inAppBrowserSession);

    return ok(inAppBrowserSession);
}

/**
 * Resolves the session a view should open with.
 *
 * The entry comes from the catalog rather than from the caller, which is what keeps a renderer
 * from naming a directory of its own choosing — and the persistence flag is read from the same
 * place for the same reason, since a caller that could set it would be choosing where a third
 * party's cookies land.
 *
 * A custom url has no entry, and an entry that keeps nothing needs no directory: both get the
 * shared in-memory partition.
 */
export async function resolveSessionForOpen(
    entry: AppsEmbeddingCatalogEntry | undefined,
): Promise<Result<Session, string>> {
    if (entry === undefined || !getPlatformSpecificEntry(entry, 'desktop')?.persistSession) {
        const inMemorySession = session.fromPartition(IN_APP_BROWSER_SESSION_PARTITION);

        denyAllPermissions(inMemorySession);
        setPlainChromeUserAgent(inMemorySession);

        return ok(inMemorySession);
    }

    return await getPersistentSession(entry.id);
}

/**
 * Cookies are written lazily — every 30 seconds or 512 operations — so a session that just
 * signed in would lose it on quit. `flushStore` is the only awaitable flush; DOM storage gets
 * the synchronous one, and IndexedDB has none.
 *
 * Bounded on purpose: one entry is the normal case, and every module's `onQuit` shares a single 5s budget.
 */
export async function flushPersistentSessions() {
    const { sessions } = await inAppBrowserContext.get();
    const tasks = Array.from(sessions.values()).map(inAppBrowserSession => {
        inAppBrowserSession.flushStorageData();

        return inAppBrowserSession.cookies.flushStore();
    });

    await Promise.allSettled(tasks);
}

export async function clearSession(
    entryId: string,
    onCloseView: () => Promise<void>,
): Promise<InvokeResult> {
    const entry = getAppsEmbeddingCatalogEntry(entryId);

    if (!getPlatformSpecificEntry(entry, 'desktop')?.persistSession) {
        // An entry that stores nothing has nothing to forget
        return { success: true };
    }

    const entrySession = await getPersistentSession(entryId);

    if (!entrySession.success) {
        return { success: false, error: entrySession.error };
    }

    const { activeEntryId } = await activeViewContext.get();

    // The live view and its popups share the session being cleared. Clearing underneath them
    // would only look like it worked — a page keeps its DOM storage in memory and writes it
    // back on the next tick — and a popup mid-flow would lose its credentials halfway through.
    if (activeEntryId === entryId) {
        logger.info(SERVICE_NAME, `Closing "${entryId}" before clearing its data`);
        await onCloseView();
        await activeViewContext.insert(() => ({ activeEntryId: undefined }));
    }

    const { clearingEntryIds } = await activeViewContext.get();

    clearingEntryIds.add(entryId);

    try {
        const activeSession = entrySession.payload;

        await activeSession.closeAllConnections();

        await Promise.allSettled([
            activeSession.clearData(),
            activeSession.clearAuthCache(),
            activeSession.clearCache(),
            activeSession.cookies.flushStore(),
        ]);

        logger.info(SERVICE_NAME, `Cleared the stored data of "${entryId}"`);

        // The directory itself stays: Electron has no way to destroy a session, so the process
        // holds its files open until it exits.
        return { success: true };
    } catch (error) {
        logger.error(SERVICE_NAME, `Failed to clear the data of "${entryId}": ${error}`);

        return { success: false, error: 'the stored data could not be cleared' };
    } finally {
        clearingEntryIds.delete(entryId);
    }
}
