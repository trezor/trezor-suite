import type { TransportInfo } from './transport';
import { UI_EVENT } from './ui-request';
import type { PermissionRequest } from '../types/method';
import type { ConnectDynamicSettings, Manifest } from '../types/settings';
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
} as const;

export interface PopupInit {
    type: typeof POPUP.INIT;
    payload: {
        settings: ConnectDynamicSettings; // settings from window.opener (sent by @trezor/connect-web)
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
            // Permissions declared up front by the host/dapp so the popup can request the whole set
            // in a single consent. Forwarded like `manifest`; sanitized by the popup.
            requestedPermissions?: PermissionRequest[];
        }; // those are settings from the iframe, they could be different from window.opener settings
        transports?: TransportInfo[];
    };
}

export interface PopupClosedMessage {
    type: typeof POPUP.CLOSED;
    payload: { error?: any; callId?: string } | null;
}

export type PopupEvent =
    | {
          type: typeof POPUP.CORE_LOADED;
          payload?: never;
      }
    | PopupInit
    | PopupHandshake
    | PopupClosedMessage;

export type PopupEventMessage = PopupEvent & { event: typeof UI_EVENT };

export const createPopupMessage: MessageFactoryFn<typeof UI_EVENT, PopupEvent> = (type, payload) =>
    ({
        event: UI_EVENT,
        type,
        payload,
    }) as any;
