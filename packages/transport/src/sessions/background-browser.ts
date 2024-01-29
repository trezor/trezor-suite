import type { Descriptor } from '../types';
import { SessionsBackground } from './background';
// @ts-expect-error (typescript does not know this is worker constructor, this is done by webpack)
import BackgroundSharedworker from './background-sharedworker';

import { RegisterBackgroundCallbacks } from './types';

/**
 * calling initBackgroundInBrowser initiates sessions-background for browser based environments and returns:
 * - `requestFn` which is used to send messages to sessions background
 * - `registerBackgroundCallbacks` which is used to accept information about descriptors change from
 *    another tab and notify local transport
 * if possible sessions background utilizes native Sharedworker. If for whatever reason
 * Sharedworker is not available, it fallbacks to local module behavior
 */
export const initBackgroundInBrowser = () => {
    try {
        const background: SharedWorker = new BackgroundSharedworker();

        const requestFn = (params: Parameters<SessionsBackground['handleMessage']>[0]) =>
            new Promise<Awaited<ReturnType<SessionsBackground['handleMessage']>>>(resolve => {
                const onmessage = (
                    message: MessageEvent<Awaited<ReturnType<SessionsBackground['handleMessage']>>>,
                ) => {
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
                    if (e && 'type' in e.data) {
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
            'Unable to load background-sharedworker. Falling back to use local module. Say bye bye to tabs synchronization',
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
