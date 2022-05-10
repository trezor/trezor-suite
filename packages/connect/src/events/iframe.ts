import { UI_EVENT } from './ui-request';
import type { ConnectSettings } from '../types';
import type { MessageFactoryFn } from '../types/utils';

export const IFRAME = {
    // Message called from iframe.html inline script before "window.onload" event. This is first message from iframe to window.opener.
    BOOTSTRAP: 'iframe-bootstrap',
    // Message from iframe.js to window.opener, called after "window.onload" event. This is second message from iframe to window.opener.
    LOADED: 'iframe-loaded',
    // Message from window.opener to iframe.js
    INIT: 'iframe-init',
    // Error message from iframe.js to window.opener. Could be thrown during iframe initialization process
    ERROR: 'iframe-error',
    // Message from window.opener to iframe. Call method
    CALL: 'iframe-call',
} as const;

export interface IFrameError {
    type: typeof IFRAME.ERROR;
    payload: {
        error: string;
        code?: string;
    };
}

export interface IFrameLoaded {
    type: typeof IFRAME.LOADED;
    payload: {
        useBroadcastChannel: boolean;
    };
}

export interface IFrameInit {
    type: typeof IFRAME.INIT;
    payload: {
        settings: ConnectSettings; // settings from window.parent (sent by @trezor/connect-web)
        extension?: string;
    };
}

export type IFrameEvent =
    | { type: typeof IFRAME.BOOTSTRAP; payload?: typeof undefined }
    | IFrameLoaded
    | IFrameInit
    | IFrameError;

export type IFrameEventMessage = IFrameEvent & { event: typeof UI_EVENT };

export const createIFrameMessage: MessageFactoryFn<typeof UI_EVENT, IFrameEvent> = (
    type,
    payload,
) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    } as any);
