import type {
    ConnectResult,
    GetAddressParams,
    GetAddressResult,
    GetDeviceStateParams,
    TrezorConnectLike,
    UiEventListener,
    UiEventMessage,
    UiResponseEvent,
} from './trezorConnectLike';

/**
 * Loose shape for UI events emitted in tests — lets a test build a synthetic
 * event (e.g. a `ui-button` or `ui-request_pin`) without constructing a fully
 * branded TrezorConnect payload (`device.path` is `DeviceUniquePath`, etc.).
 */
export type EmittableTestEvent = {
    type: string;
    payload?: unknown;
    requestId?: string;
    callId?: string;
};

export interface TrezorConnectMock extends TrezorConnectLike {
    /** Emit a UI event to all listeners. Test helper. */
    emit: (event: EmittableTestEvent) => void;
    resolveGetDeviceState: (payload: { state: string }) => void;
    rejectGetDeviceState: (error: string) => void;
    resolveGetAddress: (payload: GetAddressResult) => void;
    rejectGetAddress: (error: string) => void;
    readonly uiResponses: ReadonlyArray<UiResponseEvent>;
    readonly getDeviceStateCalls: ReadonlyArray<GetDeviceStateParams>;
    readonly getAddressCalls: ReadonlyArray<GetAddressParams>;
}

type Pending<T> = { resolve: (value: ConnectResult<T>) => void };

export const createTrezorConnectMock = (): TrezorConnectMock => {
    const listeners = new Set<UiEventListener>();
    const uiResponses: UiResponseEvent[] = [];
    const getDeviceStateCalls: GetDeviceStateParams[] = [];
    const getAddressCalls: GetAddressParams[] = [];
    let pendingDeviceState: Pending<{ state: string }> | null = null;
    let pendingAddress: Pending<GetAddressResult> | null = null;

    return {
        on: (_event, listener) => {
            listeners.add(listener);
        },
        off: (_event, listener) => {
            listeners.delete(listener);
        },
        uiResponse: response => {
            uiResponses.push(response);
        },
        cancel: () => {
            // No-op in tests — tests drive cancellation via their own helpers.
        },
        getDeviceState: params => {
            getDeviceStateCalls.push(params);

            return new Promise(resolve => {
                pendingDeviceState = { resolve };
            });
        },
        getAddress: params => {
            getAddressCalls.push(params);

            return new Promise(resolve => {
                pendingAddress = { resolve };
            });
        },
        emit: event => {
            listeners.forEach(l => l(event as UiEventMessage));
        },
        resolveGetDeviceState: payload => {
            if (!pendingDeviceState) throw new Error('No pending getDeviceState call');
            const { resolve } = pendingDeviceState;
            pendingDeviceState = null;
            resolve({ success: true, payload });
        },
        rejectGetDeviceState: error => {
            if (!pendingDeviceState) throw new Error('No pending getDeviceState call');
            const { resolve } = pendingDeviceState;
            pendingDeviceState = null;
            resolve({ success: false, payload: { error } });
        },
        resolveGetAddress: payload => {
            if (!pendingAddress) throw new Error('No pending getAddress call');
            const { resolve } = pendingAddress;
            pendingAddress = null;
            resolve({ success: true, payload });
        },
        rejectGetAddress: error => {
            if (!pendingAddress) throw new Error('No pending getAddress call');
            const { resolve } = pendingAddress;
            pendingAddress = null;
            resolve({ success: false, payload: { error } });
        },
        get uiResponses() {
            return uiResponses;
        },
        get getDeviceStateCalls() {
            return getDeviceStateCalls;
        },
        get getAddressCalls() {
            return getAddressCalls;
        },
    };
};
