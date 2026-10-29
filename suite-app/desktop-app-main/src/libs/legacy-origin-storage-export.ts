/**
 * IPC channels of the hidden export page (../legacy-origin-storage-preload.ts) to the main process
 * (../modules/legacy-origin-storage.ts). The page is not the renderer, so these bypass the sender
 * validation of ../ipcMain.ts and the module checks the sender itself.
 */
export const LEGACY_ORIGIN_EXPORT_CHANNELS = {
    objectStore: 'legacy-origin-storage/export-object-store',
    file: 'legacy-origin-storage/export-file',
    finished: 'legacy-origin-storage/export-finished',
    failed: 'legacy-origin-storage/export-failed',
} as const;
