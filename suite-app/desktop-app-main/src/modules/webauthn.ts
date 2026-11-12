import { randomBytes } from 'crypto';
import { net, session } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

import { webauthnRelyingPartyId } from '../config';
import type { ModuleInit } from './module';
import { ipcMain } from '../ipcMain';
import { createNativeWebauthnAuthenticator } from '../libs/native-webauthn-authenticator';
import {
    createActivateWebauthnFrame,
    createWebauthnFrameProtocolHandler,
    createWebauthnFrameRequestGuard,
} from '../libs/webauthn-frame';
import { createEvaluatePrfFromIpc } from '../libs/webauthn-ipc';

export const SERVICE_NAME = 'webauthn';

export const init: ModuleInit = ({ mainWindowProxy, interceptor }) => {
    interceptor.onBeforeRequest(
        createWebauthnFrameRequestGuard({
            getMainWindowTopFrame: () => mainWindowProxy.getInstance()?.webContents.mainFrame,
        }),
    );

    // Answering the frame origin here keeps it off the network: no port is opened, so no other
    // process can serve or read it. Electron can only take over the whole http scheme, so every
    // other http request is passed on unchanged.
    session.defaultSession.protocol.handle(
        'http',
        createWebauthnFrameProtocolHandler({
            readFrameScript: () => fs.readFile(path.join(__dirname, 'webauthn-frame.js'), 'utf8'),
            passThrough: request => net.fetch(request, { bypassCustomProtocolHandlers: true }),
        }),
    );

    const activateWebauthnFrame = createActivateWebauthnFrame({
        getChildFrames: () => mainWindowProxy.getInstance()?.webContents.mainFrame.frames ?? [],
    });

    ipcMain.handle('webauthn/activate-frame', () => activateWebauthnFrame());

    const nativeWebauthnAuthenticator = createNativeWebauthnAuthenticator({
        relyingPartyId: webauthnRelyingPartyId,
        getNativeWindowHandle: () => mainWindowProxy.getInstance()?.getNativeWindowHandle(),
        createCredential: async (publicKeyOptions, additionalOptions) =>
            (await import('electron-webauthn')).createCredential(
                publicKeyOptions,
                additionalOptions,
            ),
        getCredential: async (publicKeyOptions, additionalOptions) =>
            (await import('electron-webauthn')).getCredential(publicKeyOptions, additionalOptions),
        getRandomBytes: length => new Uint8Array(randomBytes(length)),
    });

    ipcMain.handle('webauthn/create-credential', () =>
        nativeWebauthnAuthenticator.createCredential(),
    );

    const evaluatePrfFromIpc = createEvaluatePrfFromIpc({
        webauthnAuthenticator: nativeWebauthnAuthenticator,
    });

    ipcMain.handle('webauthn/evaluate-prf', (_, params) => evaluatePrfFromIpc(params));
};
