/* eslint-disable no-underscore-dangle, @typescript-eslint/no-use-before-define */

// origin: https://github.com/trezor/connect/blob/develop/src/js/iframe/iframe.js

import {
    CORE_EVENT,
    UI_EVENT,
    UI,
    POPUP,
    parseMessage,
    parseConnectSettings,
    PostMessageEvent,
} from '@trezor/connect';
import { Core, init as initCore, initTransport } from '@trezor/connect/src/core';
// import { DataManager } from '@trezor/connect/src/data/DataManager';
// import { initLog } from '@trezor/connect/src/utils/debug';
// import { sendMessage } from '@trezor/connect/src/utils/windowsUtils';
// import { getOrigin } from '@trezor/connect/src/utils/urlUtils';
// import {
//     suggestBridgeInstaller,
//     suggestUdevInstaller,
// } from '@trezor/connect/src/utils/browserUtils';
// import * as storage from '@trezor/connect-common/src/storage';

let _core: Core | undefined;

// Wrapper which listens to events from Core

// let id = 0;

const handleMessage = (event: PostMessageEvent) => {
    console.log('worker-to-window event', event);

    if (!event.data) return;

    const { data } = event;

    // catch first message from window.opener
    if (!_core) {
        return;
    }

    const message = parseMessage(data);
    console.log('parsed message', message);
    // pass data to Core
    if (_core) {
        _core.handleMessage(message, true);
    } else {
        console.log('no core!');
    }
};

const init = async () => {
    console.log('- init');

    const parsedSettings = parseConnectSettings({
        // ...payload.settings,
        // extension: payload.extension,
        debug: true,
    });

    try {
        // initialize core
        _core = await initCore(parsedSettings);
        console.log('- core inited');

        _core.on(CORE_EVENT, event => {
            // popup handshake is resolved automatically
            if (_core && event.type === UI.REQUEST_UI_WINDOW) {
                _core.handleMessage({ event: UI_EVENT, type: POPUP.HANDSHAKE }, true);
                return;
            }
            // if (message.type === POPUP.CANCEL_POPUP_REQUEST) {
            //     return;
            // }

            console.log('worker-to-window CORE_EVENT', event);
            // if (event?.id === id) {
            postMessage(event);
            // }
        });

        // initialize transport and wait for the first transport event (start or error)
        await initTransport(parsedSettings);
        console.log('- transport initiated');

        // postMessage(
        //     createIFrameMessage(IFRAME.LOADED, { useBroadcastChannel: !!_popupMessagePort }),
        // );
    } catch (error) {
        // postMessage(createIFrameMessage(IFRAME.ERROR, { error }));
    }
};

self.addEventListener('message', handleMessage, false);
self.addEventListener('unload', () => {
    if (_core) {
        _core.dispose();
    }
});
self.addEventListener('load', () => {
    console.log('load listener');
});

init();
