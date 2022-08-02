import {
    ActionCreatorWithoutPayload,
    ActionCreatorWithPayload,
    AnyAction,
    createAsyncThunk,
} from '@reduxjs/toolkit';

import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    ConnectSettings,
    DEVICE_EVENT,
    Manifest,
    TRANSPORT_EVENT,
    UI_EVENT,
} from '@trezor/connect';

import { cardanoConnectPatch } from './cardanoConnectPatch';

type Selector<TReturnValue> = (state: any) => TReturnValue;
type SuiteCompatibleAction<TPayload = void> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;

export const CONNECT_INIT_ACTION_TYPE = '@suite-common/connect-init/init';

export const prepareConnectInitThunk = ({
    actions,
    selectors,
    initSettings,
}: {
    actions: {
        lockDevice: SuiteCompatibleAction<boolean>;
    };
    selectors: {
        selectEnabledNetworks: Selector<string[]>;
        selectIsPendingTransportEvent: Selector<boolean>;
    };
    initSettings: { manifest: Manifest } & Partial<ConnectSettings>;
}) =>
    createAsyncThunk<
        void,
        void,
        {
            state: any;
        }
    >(CONNECT_INIT_ACTION_TYPE, async (_, { dispatch, getState }) => {
        const { selectEnabledNetworks, selectIsPendingTransportEvent } = selectors;
        const { lockDevice } = actions;

        const enabledNetworks = selectEnabledNetworks(getState());

        // set event listeners and dispatch as
        TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
            // dispatch event as action
            dispatch(action);
        });

        const wrappedMethods = [
            'getFeatures',
            'getDeviceState',
            'getAddress',
            'ethereumGetAddress',
            'rippleGetAddress',
            'cardanoGetAddress',
            'applySettings',
            'changePin',
            'pushTransaction',
            'ethereumSignTransaction',
            'signTransaction',
            'rippleSignTransaction',
            'cardanoSignTransaction',
            'backupDevice',
            'recoveryDevice',
        ] as const;

        wrappedMethods.forEach(key => {
            // typescript complains about params and return type, need to be "any"
            const original: any = TrezorConnect[key];
            if (!original) return;
            (TrezorConnect[key] as any) = async (params: any) => {
                dispatch(lockDevice(true));
                const result = await original(params);
                dispatch(lockDevice(false));
                return result;
            };
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
    });
