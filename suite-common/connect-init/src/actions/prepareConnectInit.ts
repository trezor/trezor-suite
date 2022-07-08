import {
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    AnyAction,
    createAsyncThunk,
} from '@reduxjs/toolkit';

import TrezorConnect, { ConnectSettings, Manifest } from '@trezor/connect';

import { cardanoConnectPatch } from '../cardanoConnectPatch';
import { lockDeviceConnectPatch } from '../lockDeviceConnectPatch';
import { bindConnectActionsListeners, ConnectEventAction } from '../bindConnectActionsListeners';

type Selector<TReturnValue> = (state: any) => TReturnValue;
type SuiteCompatibleAction<TPayload = void> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;

export const CONNECT_INIT_ACTION_TYPE = '@suite-common/connect-init/init';

export const prepareConnectInit = createAsyncThunk<
    void,
    {
        actions: {
            lockDevice: SuiteCompatibleAction<boolean>;
        };
        selectors: {
            selectEnabledNetworks: Selector<string[]>;
            selectIsPendingTransportEvent: Selector<boolean>;
        };
        initSettings: { manifest: Manifest } & Partial<ConnectSettings>;
    },
    {
        state: any;
    }
>(
    CONNECT_INIT_ACTION_TYPE,
    async ({ actions, selectors, initSettings }, { dispatch, getState }) => {
        const { selectEnabledNetworks, selectIsPendingTransportEvent } = selectors;
        const { lockDevice } = actions;

        const enabledNetworks = selectEnabledNetworks(getState());

        bindConnectActionsListeners({
            onEvent: (action: ConnectEventAction) => dispatch(action),
        });

        lockDeviceConnectPatch({
            onDeviceLock: () => dispatch(lockDevice(true)),
            onDeviceUnlock: () => dispatch(lockDevice(false)),
        });

        cardanoConnectPatch(enabledNetworks);

        try {
            await TrezorConnect.init({
                ...initSettings,
                pendingTransportEvent: selectIsPendingTransportEvent(getState()),
            });
        } catch (error) {
            let formattedError: string;
            if (typeof error === 'string') {
                formattedError = error;
            } else {
                formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
            }
            throw new Error(formattedError);
        }
    },
);
