import type {
    ConnectResult,
    TrezorConnectLike,
    UiEvent,
    UiEventListener,
    UiResponse,
} from './trezorConnectLike';

export interface TrezorConnectMock extends TrezorConnectLike {
    emit: (event: UiEvent) => void;
    resolveGetDeviceState: (payload: { state: string }) => void;
    rejectGetDeviceState: (error: string) => void;
    readonly uiResponses: ReadonlyArray<UiResponse>;
    readonly getDeviceStateCalls: ReadonlyArray<{
        device: { path: string };
        useEmptyPassphrase?: boolean;
    }>;
}

type Pending = {
    resolve: (value: ConnectResult<{ state: string }>) => void;
};

export const createTrezorConnectMock = (): TrezorConnectMock => {
    const listeners = new Set<UiEventListener>();
    const uiResponses: UiResponse[] = [];
    const getDeviceStateCalls: Array<{
        device: { path: string };
        useEmptyPassphrase?: boolean;
    }> = [];
    let pending: Pending | null = null;

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
        getDeviceState: params => {
            getDeviceStateCalls.push(params);

            return new Promise(resolve => {
                pending = { resolve };
            });
        },
        emit: event => {
            listeners.forEach(l => l(event));
        },
        resolveGetDeviceState: payload => {
            if (!pending) throw new Error('No pending getDeviceState call');
            const { resolve } = pending;
            pending = null;
            resolve({ success: true, payload });
        },
        rejectGetDeviceState: error => {
            if (!pending) throw new Error('No pending getDeviceState call');
            const { resolve } = pending;
            pending = null;
            resolve({ success: false, payload: { error } });
        },
        get uiResponses() {
            return uiResponses;
        },
        get getDeviceStateCalls() {
            return getDeviceStateCalls;
        },
    };
};
