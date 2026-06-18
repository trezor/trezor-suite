import type { PopupEventMessage, UiEventMessage, UiResponseEvent } from '@trezor/connect-common';
import { UI_REQUEST, UI_RESPONSE } from '@trezor/connect-common';

export { UI_REQUEST, UI_RESPONSE };
export type { UiEventMessage, PopupEventMessage, UiResponseEvent };

// Every UI event TrezorConnect can emit on the UI_EVENT channel. The flow
// surfaces all variants by default so any wrapped method's events are visible
// without an opt-in; per-method narrowing is opt-in via
// `Extract<UiEvent, { type: ... }>` at the consumer.
export type UiEvent = UiEventMessage;

// Real TrezorConnect.on('UI_EVENT', cb) emits both UI events and popup messages
// on the same channel. Listener accepts both so a real TrezorConnect instance
// is structurally assignable to TrezorConnectLike.
export type UiEventListener = (event: UiEventMessage | PopupEventMessage) => void;

export type ConnectResult<T> =
    | { success: true; payload: T }
    | { success: false; payload: { error: string; code?: string } };

export interface GetDeviceStateParams {
    device: { path: string };
    useEmptyPassphrase?: boolean;
    callId?: string;
}

export interface GetAddressParams {
    device?: { path: string };
    path: string | number[];
    coin?: string;
    showOnTrezor?: boolean;
    callId?: string;
}

export interface GetAddressResult {
    address: string;
    path: number[];
    serializedPath: string;
}

export interface TrezorConnectLike {
    on(event: 'UI_EVENT', listener: UiEventListener): void;
    off(event: 'UI_EVENT', listener: UiEventListener): void;
    uiResponse(response: UiResponseEvent): void;
    cancel(message?: string): void;
    getDeviceState(params: GetDeviceStateParams): Promise<ConnectResult<{ state: string }>>;
    getAddress(params: GetAddressParams): Promise<ConnectResult<GetAddressResult>>;
}
