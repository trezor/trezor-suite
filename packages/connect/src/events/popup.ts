import { UI_EVENT } from './ui-request';
import type { TransportInfo } from './transport';
import type { ConnectSettings, SystemInfo } from '../types';
import type { MessageFactoryFn } from '../types/utils';

export const POPUP = {
    // Message called from popup.html inline script before "window.onload" event. This is first message from popup to window.opener.
    BOOTSTRAP: 'popup-bootstrap',
    // Message from popup.js to window.opener, called after "window.onload" event. This is second message from popup to window.opener.
    LOADED: 'popup-loaded',
    // Message from window.opener to popup.js. Send settings to popup. This is first message from window.opener to popup.
    INIT: 'popup-init',
    // Error message from popup to window.opener. Could be thrown during popup initialization process (POPUP.INIT)
    ERROR: 'popup-error',
    // Message to webextensions, opens "trezor-usb-permission.html" within webextension
    EXTENSION_USB_PERMISSIONS: 'open-usb-permissions',
    // Message called from both [popup > iframe] then [iframe > popup] in this exact order.
    // Firstly popup call iframe to resolve popup promise in Core
    // Then iframe reacts to POPUP.HANDSHAKE message and sends ConnectSettings, transport information and requested method details back to popup
    HANDSHAKE: 'popup-handshake',
    // Event emitted from PopupManager at the end of popup closing process.
    // Sent from popup thru window.opener to an iframe because message channel between popup and iframe is no longer available
    CLOSED: 'popup-closed',
    // Message called from iframe to popup, it means that popup will not be needed (example: Blockchain methods are not using popup at all)
    // This will close active popup window and/or clear opening process in PopupManager (maybe popup wasn't opened yet)
    CANCEL_POPUP_REQUEST: 'ui-cancel-popup-request',
    // Message called from inline element in popup.html (window.closeWindow), this is used only with webextensions to properly handle popup close event
    CLOSE_WINDOW: 'window.close',
    // todo: shouldn't it be UI_RESPONSE?
    ANALYTICS_RESPONSE: 'popup-analytics-response',
    /** method.info async getter result passed from core to popup */
    METHOD_INFO: 'popup-method-info',
} as const;

export interface PopupInit {
    type: typeof POPUP.INIT;
    payload: {
        settings: ConnectSettings; // settings from window.opener (sent by @trezor/connect-web)
        useBroadcastChannel: boolean;
        systemInfo: SystemInfo;
    };
}

export interface PopupHandshake {
    type: typeof POPUP.HANDSHAKE;
    payload: {
        settings: ConnectSettings; // those are settings from the iframe, they could be different from window.opener settings
        transport?: TransportInfo;
    };
}

export interface PopupError {
    type: typeof POPUP.ERROR;
    payload: {
        error: string;
    };
}

export interface PopupClosedMessage {
    type: typeof POPUP.CLOSED;
    payload: { error: any } | null;
}

export interface PopupAnalyticsResponse {
    type: typeof POPUP.ANALYTICS_RESPONSE;
    payload: { enabled: boolean };
}

export interface PopupMethodInfo {
    type: typeof POPUP.METHOD_INFO;
    payload: { info: string; method: string };
}

export type PopupEvent =
    | {
          type: typeof POPUP.LOADED | typeof POPUP.CANCEL_POPUP_REQUEST;
          payload?: typeof undefined;
      }
    | PopupInit
    | PopupHandshake
    | PopupError
    | PopupClosedMessage
    | PopupAnalyticsResponse
    | PopupMethodInfo;

export type PopupEventMessage = PopupEvent & { event: typeof UI_EVENT };

export const createPopupMessage: MessageFactoryFn<typeof UI_EVENT, PopupEvent> = (type, payload) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
