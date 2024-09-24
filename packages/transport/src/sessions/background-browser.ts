import type { Descriptor } from '../types';
import { SessionsBackground } from './background';

import { RegisterBackgroundCallbacks } from './types';

const defaultSessionsBackgroundUrl =
    window.location.origin +
    `${process.env.ASSET_PREFIX || ''}/workers/sessions-background-sharedworker.js`
        // just in case so that whoever defines ASSET_PREFIX does not need to worry about trailing slashes
        .replace(/\/+/g, '/');

/**
 * calling initBackgroundInBrowser initiates sessions-background for browser based environments and returns:
 * - `requestFn` which is used to send messages to sessions background
 * - `registerBackgroundCallbacks` which is used to accept information about descriptors change from
 *    another tab and notify local transport
 * if possible sessions background utilizes native Sharedworker. If for whatever reason
 * Sharedworker is not available, it fallbacks to local module behavior
 */
export const initBackgroundInBrowser = async (
    sessionsBackgroundUrl = defaultSessionsBackgroundUrl,
): Promise<{
    background: SessionsBackground | SharedWorker;
    requestFn: SessionsBackground['handleMessage'];
    registerBackgroundCallbacks: RegisterBackgroundCallbacks;
}> => {
    try {
        // fetch to validate - failed fetch via SharedWorker constructor does not throw. It even hangs resulting in all kinds of weird behaviors
        await fetch(sessionsBackgroundUrl, { method: 'HEAD' }).then(response => {
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch sessions-background SharedWorker from url: ${sessionsBackgroundUrl}`,
                );
            }
        });
        const background = new SharedWorker(sessionsBackgroundUrl, {
            name: '@trezor/connect-web transport sessions worker',
        });

        const requestFn: SessionsBackground['handleMessage'] = (
            params: Parameters<SessionsBackground['handleMessage']>[0],
        ) =>
            new Promise(resolve => {
                const onmessage = (message: MessageEvent<any>) => {
                    if (params.id === message.data.id) {
                        resolve(message.data);
                        background.port.removeEventListener('message', onmessage);
                    }
                };

                background.port.addEventListener('message', onmessage);

                background.port.onmessageerror = message => {
                    // not sure under what circumstances this error occurs. let's observe it during testing
                    console.error('background-browser onmessageerror,', message);

                    background.port.removeEventListener('message', onmessage);
                };
                background.port.postMessage(params);
            });

        const registerBackgroundCallbacks: RegisterBackgroundCallbacks = onDescriptorsCallback => {
            background.port.addEventListener(
                'message',
                (
                    e: MessageEvent<
                        //  either standard response from sessions background (we ignore this one)
                        | Awaited<ReturnType<SessionsBackground['handleMessage']>>
                        // or artificially broadcasted message to all clients (see background-sharedworker)
                        | { type: 'descriptors'; payload: Descriptor[] }
                    >,
                ) => {
                    if ('type' in e?.data) {
                        if (e.data.type === 'descriptors') {
                            onDescriptorsCallback(e.data.payload);
                        }
                    }
                },
            );
        };

        return { background, requestFn, registerBackgroundCallbacks };
    } catch (err) {
        console.warn(
            'Unable to load background-sharedworker. Falling back to use local module. Say bye bye to tabs synchronization. Error details: ',
            err.message,
        );

        const background = new SessionsBackground();
        const registerBackgroundCallbacks: RegisterBackgroundCallbacks = onDescriptorsCallback => {
            background.on('descriptors', descriptors => {
                onDescriptorsCallback(descriptors);
            });
        };

        return {
            background,
            requestFn: background.handleMessage.bind(background),
            registerBackgroundCallbacks,
        };
    }
};
