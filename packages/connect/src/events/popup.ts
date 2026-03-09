import type { TransportInfo } from './transport';
import { UI_EVENT } from './ui-request';
import type { ConnectSettings, Manifest } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

export { POPUP } from '@trezor/connect-common';

export interface PopupInit {
    type: typeof POPUP.INIT;
    payload: {
        settings: ConnectSettings; // settings from window.opener (sent by @trezor/connect-web)
        useBroadcastChannel: boolean;
        useCore?: boolean;
    };
}

export interface PopupHandshake {
    type: typeof POPUP.HANDSHAKE;
    payload: {
        settings: {
            manifest?: Manifest;
            version: string;
        }; // those are settings from the iframe, they could be different from window.opener settings
        transports?: TransportInfo[];
    };
}

export interface PopupClosedMessage {
    type: typeof POPUP.CLOSED;
    payload: { error: any } | null;
}

export interface PopupContentScriptLoaded {
    type: typeof POPUP.CONTENT_SCRIPT_LOADED;
    payload: { id: string; contentScriptVersion: number };
}

export interface PopupCloseWindow {
    type: typeof POPUP.CLOSE_WINDOW;
    payload: typeof undefined;
}

export type PopupEvent =
    | {
          type: typeof POPUP.CORE_LOADED;
          payload?: typeof undefined;
      }
    | PopupInit
    | PopupHandshake
    | PopupContentScriptLoaded
    | PopupCloseWindow
    | PopupClosedMessage;

export type PopupEventMessage = PopupEvent & { event: typeof UI_EVENT };

export const createPopupMessage: MessageFactoryFn<typeof UI_EVENT, PopupEvent> = (type, payload) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
