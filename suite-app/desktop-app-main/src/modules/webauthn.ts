import { app, net, session } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

import { isMacOs } from '@trezor/env-utils';

import { webauthnKeychainAccessGroup } from '../config';
import type { ModuleInit } from './module';
import { ipcMain } from '../ipcMain';
import {
    createActivateWebauthnFrame,
    createWebauthnFrameProtocolHandler,
} from '../libs/webauthn-frame';

export const SERVICE_NAME = 'webauthn';

export const init: ModuleInit = ({ mainWindowProxy }) => {
    if (isMacOs()) {
        app.configureWebAuthn({
            touchID: {
                keychainAccessGroup: webauthnKeychainAccessGroup,
                promptReason: 'verify your identity on $1',
            },
        });
    }

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
};
