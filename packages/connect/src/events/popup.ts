import type { TransportInfo } from './transport';
import { UI_EVENT } from './ui-request';
import type { ConnectSettings, Manifest } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

export const POPUP = {
    // Message from popup run in "core" mode. Connect core has been loaded, popup is ready to handle messages
    CORE_LOADED: 'popup-core-loaded',
    // Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.
    INIT: 'popup-init',
    // Firstly popup call iframe to resolve popup promise in Core
    // Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup
    HANDSHAKE: 'popup-handshake',
    // Event emitted from PopupManager at the end of popup closing process.
    // Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available
    CLOSED: 'popup-closed',
    // Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event
    CLOSE_WINDOW: 'window.close',
    // not used anymore, will removed in https://github.com/trezor/trezor-suite/pull/24471
    CONTENT_SCRIPT_LOADED: 'popup-content-script-loaded',
} as const;

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
