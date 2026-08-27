import type { ElectronIpcMainInvokeEvent } from './types';

type IsSenderFrameDestroyed = { ipcEvent: ElectronIpcMainInvokeEvent };

/**
 * Check whether the sender frame, which this ipcEvent came from, has been destroyed in the meantime.
 * That can happen as a race condition when renderer process is closed during responding.
 * It is by itself harmless, but causes a flood of errors.
 * https://github.com/electron/electron/blob/3536d49/docs/api/structures/ipc-main-event.md
 * https://github.com/electron/electron/blob/3536d49/docs/breaking-changes.md#behavior-changed-frame-properties-may-retrieve-detached-webframemain-instances-or-none-at-all
 */
export const isSenderFrameDestroyed = ({ ipcEvent }: IsSenderFrameDestroyed) =>
    !ipcEvent?.senderFrame || ipcEvent.senderFrame.isDestroyed();
