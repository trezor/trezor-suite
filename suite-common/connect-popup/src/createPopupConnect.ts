import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import type { CallMethodKeys, CallMethodPayload } from '@trezor/connect';
import { type TrezorConnectCallable, connectCallableMethods } from '@trezor/connect-common';
import { typedObjectFromEntries } from '@trezor/utils';

import { getPopupCallDeferred } from './connectPopupPromiseManager';
import {
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    connectPopupCallThunk,
} from './connectPopupThunks';
import type { ConnectCallSource } from './connectPopupTypes';

export type PopupConnectDeps = {
    readonly source: ConnectCallSource;
    readonly dispatch: ThunkDispatch<
        ConnectPopupCallThunkState,
        ConnectPopupCallThunkDeps,
        UnknownAction
    >;
};

export type PopupConnect = TrezorConnectCallable;

type PopupCallParams = Omit<CallMethodPayload, 'method'>;

/**
 * Connect for code that acts for someone else, such as a dapp, and must not reach the device on
 * its own. Every method is a popup call made for `source`, so the popup's checks, the user's
 * consent, the analytics and the device lock apply to it as to any other call from that source.
 */
export const createPopupConnect = (deps: PopupConnectDeps): PopupConnect => {
    const createMethod =
        (method: CallMethodKeys) =>
        // The popup calls the device selected when the call is made, as for every other call, so
        // a device the caller chose earlier is not passed on.
        ({ device: _device, ...payload }: PopupCallParams) => {
            const { promise } = getPopupCallDeferred(true);
            deps.dispatch(connectPopupCallThunk({ source: deps.source, method, payload }));

            return promise;
        };

    // Connect builds its own methods from this list in the same way, see `factoryPrivileged`. Each
    // one answers with the response of the Connect method the popup called for it, which the
    // single deferred can only type as any Connect response.
    return typedObjectFromEntries(
        connectCallableMethods.map(method => [method, createMethod(method)] as const),
    ) as unknown as PopupConnect;
};
