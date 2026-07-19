import { produce } from 'immer';
import { type Action as ReduxAction } from 'redux';

import type { CountryCode } from '@suite-common/geolocation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TRANSPORT, type TransportEvent, type TransportInfo } from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import { STORAGE, SUITE } from 'src/actions/suite/constants';
import { type StorageAction } from 'src/actions/suite/storageActions';
import { type SuiteAction } from 'src/actions/suite/suiteActions';

type SuiteReducerAction = StorageAction | SuiteAction | TransportEvent;

const SUITE_REDUCER_ACTION_TYPES = [
    STORAGE.LOAD,
    STORAGE.ERROR,
    STORAGE.CORRUPTED,
    SUITE.INIT,
    SUITE.READY,
    SUITE.ERROR,
    SUITE.SET_RECENTLY_CONNECTED_DEVICE,
    SUITE.SET_RECENTLY_DISCONNECTED_DEVICE,
    SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION,
    SUITE.EVM_CONFIRM_EXPLANATION_MODAL,
    SUITE.EVM_CLOSE_EXPLANATION_BANNER,
    SUITE.SET_SEND_FORM_PREFILL,
    SUITE.SET_TRANSACTION_HISTORY_PREFILL,
    TRANSPORT.START,
    TRANSPORT.ERROR,
    SUITE.ONLINE_STATUS,
] as const satisfies SuiteReducerAction['type'][];

const isSuiteReducerAction = (action: ReduxAction): action is SuiteReducerAction =>
    isArrayMember(action.type, SUITE_REDUCER_ACTION_TYPES);

export type SuiteRootState = {
    suite: SuiteState;
};

type SuiteLifecycle =
    | { status: 'initial' }
    | { status: 'loading' }
    | { status: 'ready' }
    // errors set from connect, should be renamed
    | { status: 'error'; error: string }
    // blocked if the instance cannot upgrade due to older version running,
    // blocking in case instance is running older version thus blocking other instance
    | { status: 'db-error'; error: 'blocking' | 'blocked' }
    // inconsistent IDB state detected, need to reset storage
    | { status: 'db-corrupted'; error: unknown };

export interface EvmSettings {
    confirmExplanationModalClosed: Partial<Record<NetworkSymbol, Record<string, boolean>>>;
    explanationBannerClosed: Partial<Record<NetworkSymbol, boolean>>;
}

export interface PrefillFields {
    sendForm?: string;
    transactionHistory?: string;
}

export interface TransportState {
    transports: TransportInfo[];
    error?: string;
}

export type SuiteState = {
    online: boolean;
    lifecycle: SuiteLifecycle;
    transport?: TransportState;
    evmSettings: EvmSettings;
    countryCode: CountryCode | null;
    prefillFields: PrefillFields;
    recentlyConnectedDeviceRef: string | null; // TODO use type DeviceRef from suite-types; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
    recentlyDisconnectedDevice: string | null;
    seenDisconnectNotificationForDeviceIds: string[];
};

const initialState: SuiteState = {
    online: true,
    lifecycle: { status: 'initial' },
    evmSettings: {
        confirmExplanationModalClosed: {},
        explanationBannerClosed: {},
    },
    prefillFields: {
        sendForm: '',
        transactionHistory: '',
    },
    countryCode: null,
    recentlyConnectedDeviceRef: null,
    recentlyDisconnectedDevice: null,
    seenDisconnectNotificationForDeviceIds: [],
};

export const suiteInitialState = initialState;

const suiteReducer = (state: SuiteState = initialState, action: ReduxAction): SuiteState => {
    if (!isSuiteReducerAction(action)) {
        return state;
    }

    const suiteAction: SuiteReducerAction = action;

    return produce(state, draft => {
        switch (suiteAction.type) {
            case STORAGE.LOAD:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    ...suiteAction.payload.suiteSettings?.evmSettings,
                };
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    ...(suiteAction.payload.suiteSettings?.seenDisconnectNotificationForDeviceIds ??
                        []),
                ];
                break;
            case STORAGE.ERROR:
                draft.lifecycle = { status: 'db-error', error: suiteAction.payload };
                break;
            case STORAGE.CORRUPTED:
                draft.lifecycle = { status: 'db-corrupted', error: suiteAction.payload };
                break;
            case SUITE.INIT:
                draft.lifecycle = { status: 'loading' };
                break;
            case SUITE.READY:
                draft.lifecycle = { status: 'ready' };
                break;

            case SUITE.ERROR:
                draft.lifecycle = { status: 'error', error: suiteAction.error };
                break;

            case SUITE.SET_RECENTLY_CONNECTED_DEVICE:
                draft.recentlyConnectedDeviceRef = suiteAction.payload;
                break;
            case SUITE.SET_RECENTLY_DISCONNECTED_DEVICE:
                draft.recentlyDisconnectedDevice = suiteAction.payload;
                break;
            case SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION:
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    suiteAction.payload.deviceId,
                ];
                break;

            case SUITE.EVM_CONFIRM_EXPLANATION_MODAL:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    confirmExplanationModalClosed: {
                        ...draft.evmSettings.confirmExplanationModalClosed,
                        [suiteAction.symbol]: {
                            ...draft.evmSettings.confirmExplanationModalClosed[suiteAction.symbol],
                            [suiteAction.route]: true,
                        },
                    },
                };
                break;

            case SUITE.EVM_CLOSE_EXPLANATION_BANNER:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    explanationBannerClosed: {
                        ...draft.evmSettings.explanationBannerClosed,
                        [suiteAction.symbol]: true,
                    },
                };
                break;

            case SUITE.SET_SEND_FORM_PREFILL:
                draft.prefillFields.sendForm = suiteAction.payload.contractAddress;
                break;

            case SUITE.SET_TRANSACTION_HISTORY_PREFILL:
                draft.prefillFields.transactionHistory = suiteAction.payload;
                break;

            case TRANSPORT.START: {
                const { ...transport } = suiteAction.payload;
                const transports = draft.transport?.transports ?? [];
                const index = transports.findIndex(t => t.apiType === transport.apiType);
                if (index >= 0) transports[index] = transport;
                else transports.push(transport);
                draft.transport = { transports };
                break;
            }
            case TRANSPORT.ERROR: {
                const { apiType, error } = suiteAction.payload;
                const transports =
                    !draft.transport || !apiType
                        ? (draft.transport?.transports ?? [])
                        : draft.transport.transports?.filter(t => t.apiType !== apiType);
                draft.transport = { transports, error };
                break;
            }
            case SUITE.ONLINE_STATUS:
                draft.online = suiteAction.payload;
                break;

            // no default
        }
    });
};

export default suiteReducer;
