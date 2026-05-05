import type {
    ConnectResult,
    GetAddressParams,
    GetAddressResult,
    GetDeviceStateParams,
    TrezorConnectLike,
    UiEvent,
    UiEventListener,
    UiResponse,
} from './trezorConnectLike';

export interface TrezorConnectMock extends TrezorConnectLike {
    /** Emit a UI event to all listeners. Test helper. */
    emit: (event: UiEvent) => void;
    resolveGetDeviceState: (payload: { state: string }) => void;
    rejectGetDeviceState: (error: string) => void;
    resolveGetAddress: (payload: GetAddressResult) => void;
    rejectGetAddress: (error: string) => void;
    readonly uiResponses: ReadonlyArray<UiResponse>;
    readonly getDeviceStateCalls: ReadonlyArray<GetDeviceStateParams>;
    readonly getAddressCalls: ReadonlyArray<GetAddressParams>;
}

type Pending<T> = { resolve: (value: ConnectResult<T>) => void };

export const createTrezorConnectMock = (): TrezorConnectMock => {
    const listeners = new Set<UiEventListener>();
    const uiResponses: UiResponse[] = [];
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
            listeners.forEach(l => l(event));
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
