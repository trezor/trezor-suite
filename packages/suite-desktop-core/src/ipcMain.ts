// This file is the central place to directly import electron.ipcMain and wrap it with security validation.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { ipcMain as baseIpcMain } from 'electron';

import { validateIpcMessage } from '@trezor/ipc-proxy';
import type * as desktopApi from '@trezor/suite-desktop-api';

export type StrictIpcMain = desktopApi.StrictIpcMain<
    Omit<Electron.IpcMain, 'handle' | 'handleOnce' | 'removeHandler'>,
    Electron.IpcMainInvokeEvent
>;

const withValidation = <T extends (...args: any[]) => any>(fn: T): T =>
    ((...args: any[]) => {
        const [ipcEvent] = args;
        validateIpcMessage({ ipcEvent });

        return fn(...args);
    }) as T;

const on: Electron.IpcMain['on'] = (channel, listener) =>
    baseIpcMain.on(channel, withValidation(listener));

const once: Electron.IpcMain['once'] = (channel, listener) =>
    baseIpcMain.once(channel, withValidation(listener));

const addListener: Electron.IpcMain['addListener'] = (channel, listener) =>
    baseIpcMain.addListener(channel, withValidation(listener));

const handle: Electron.IpcMain['handle'] = (channel, handler) =>
    baseIpcMain.handle(channel, withValidation(handler));

const handleOnce: Electron.IpcMain['handleOnce'] = (channel, handler) =>
    baseIpcMain.handleOnce(channel, withValidation(handler));

/**
 * `ipcMain` with listeners wrapped in security validation, but untyped IPC channels (original electron type).
 * Use only in cases that declare their own IPC channel API (createIpcProxyHandler).
 */
export const looselyTypedIpcMain: Electron.IpcMain = Object.assign(
    Object.create(baseIpcMain ?? {}),
    baseIpcMain,
    {
        on,
        once,
        addListener,
        handle,
        handleOnce,
    },
);

/**
 * `ipcMain` with listeners wrapped in security validation, and with IPC channels typed to a strict API contract (@trezor/suite-desktop-api).
 * This should be used in Electron Main modules.
 */
export const ipcMain: StrictIpcMain = looselyTypedIpcMain;
