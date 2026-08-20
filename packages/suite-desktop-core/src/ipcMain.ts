// This file is the one wrapper where we shall import electron.ipcMain
// eslint-disable-next-line local-rules/no-electron-ipc-main-reference
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
 * @deprecated direct export of electron.ipcMain that does not validate sender frame.
 * Use only in cases where you need to do validation yourself (createIpcProxyHandler).
 */
export const rawIpcMain = baseIpcMain;

/**
 * ipcMain with listeners wrapped in security validation.
 * Unless specifically needed, this should be used instead of rawIpcMain.
 */
export const ipcMain: StrictIpcMain = Object.assign(Object.create(baseIpcMain ?? {}), baseIpcMain, {
    on,
    once,
    addListener,
    handle,
    handleOnce,
});
