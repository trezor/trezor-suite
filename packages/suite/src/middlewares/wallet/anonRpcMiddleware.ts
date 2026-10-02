import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import {
    type SuiteSettingsRootState,
    selectHasExperimentalFeature,
    suiteSettingsActions,
} from '@suite/settings';
import { setCustomBackendThunk } from '@suite-common/wallet-core';
import { type Dispatch } from '@trezor/redux-utils';

import { ANON_RPC_NETWORK_SYMBOLS } from '#src/utils/wallet/anonRpcUtils';

const selectIsAnonRpcEnabled = selectHasExperimentalFeature('anon-rpc');

// Connect receives the anon-rpc settings together with a backend, so turning the feature on or off
// has to hand the backends over again. That must follow the state change, which an experimental
// feature's onToggle runs before.
export const anonRpcMiddleware =
    (api: MiddlewareAPI<Dispatch, SuiteSettingsRootState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        if (!suiteSettingsActions.setExperimentalFeatures.match(action)) {
            return next(action);
        }

        const wasAnonRpcEnabled = selectIsAnonRpcEnabled(api.getState());
        next(action);

        if (selectIsAnonRpcEnabled(api.getState()) !== wasAnonRpcEnabled) {
            ANON_RPC_NETWORK_SYMBOLS.forEach(symbol => api.dispatch(setCustomBackendThunk(symbol)));
        }

        return action;
    };
