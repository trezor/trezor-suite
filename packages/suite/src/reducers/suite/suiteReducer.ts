import { produce } from 'immer';

import type { CountryCode } from '@suite-common/geolocation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TRANSPORT, type TransportInfo } from '@trezor/connect';

import { STORAGE, SUITE } from 'src/actions/suite/constants';
import { type Action, type TorBootstrap, TorStatus } from 'src/types/suite';

export interface SuiteRootState {
    suite: SuiteState;
}

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

export interface SuiteState {
    online: boolean;
    torStatus: TorStatus;
    torBootstrap: TorBootstrap | null;
    lifecycle: SuiteLifecycle;
    transport?: TransportState;
    evmSettings: EvmSettings;
    countryCode: CountryCode | null;
    prefillFields: PrefillFields;
    recentlyConnectedDeviceRef: string | null; // TODO use type DeviceRef from suite-types; currently WIP in https://github.com/trezor/trezor-suite/pull/20955
    recentlyDisconnectedDevice: string | null;
    seenDisconnectNotificationForDeviceIds: string[];
}

const initialState: SuiteState = {
    online: true,
    torStatus: TorStatus.Disabled,
    torBootstrap: null,
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

const suiteReducer = (state: SuiteState = initialState, action: Action): SuiteState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    ...action.payload.suiteSettings?.evmSettings,
                };
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    ...(action.payload.suiteSettings?.seenDisconnectNotificationForDeviceIds ?? []),
                ];
                break;
            case STORAGE.ERROR:
                draft.lifecycle = { status: 'db-error', error: action.payload };
                break;
            case STORAGE.CORRUPTED:
                draft.lifecycle = { status: 'db-corrupted', error: action.payload };
                break;
            case SUITE.INIT:
                draft.lifecycle = { status: 'loading' };
                break;
            case SUITE.READY:
                draft.lifecycle = { status: 'ready' };
                break;

            case SUITE.ERROR:
                draft.lifecycle = { status: 'error', error: action.error };
                break;

            case SUITE.SET_RECENTLY_CONNECTED_DEVICE:
                draft.recentlyConnectedDeviceRef = action.payload;
                break;
            case SUITE.SET_RECENTLY_DISCONNECTED_DEVICE:
                draft.recentlyDisconnectedDevice = action.payload;
                break;
            case SUITE.ADD_DEVICE_ID_TO_SEEN_DISCONNECT_NOTIFICATION:
                draft.seenDisconnectNotificationForDeviceIds = [
                    ...draft.seenDisconnectNotificationForDeviceIds,
                    action.payload.deviceId,
                ];
                break;

            case SUITE.EVM_CONFIRM_EXPLANATION_MODAL:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    confirmExplanationModalClosed: {
                        ...draft.evmSettings.confirmExplanationModalClosed,
                        [action.symbol]: {
                            ...draft.evmSettings.confirmExplanationModalClosed[action.symbol],
                            [action.route]: true,
                        },
                    },
                };
                break;

            case SUITE.EVM_CLOSE_EXPLANATION_BANNER:
                draft.evmSettings = {
                    ...draft.evmSettings,
                    explanationBannerClosed: {
                        ...draft.evmSettings.explanationBannerClosed,
                        [action.symbol]: true,
                    },
                };
                break;

            case SUITE.SET_SEND_FORM_PREFILL:
                draft.prefillFields.sendForm = action.payload.contractAddress;
                break;

            case SUITE.SET_TRANSACTION_HISTORY_PREFILL:
                draft.prefillFields.transactionHistory = action.payload;
                break;

            case TRANSPORT.START: {
                const { ...transport } = action.payload;
                const transports = draft.transport?.transports ?? [];
                const index = transports.findIndex(t => t.apiType === transport.apiType);
                if (index >= 0) transports[index] = transport;
                else transports.push(transport);
                draft.transport = { transports };
                break;
            }
            case TRANSPORT.ERROR: {
                const { apiType, error } = action.payload;
                const transports =
                    !draft.transport || !apiType
                        ? (draft.transport?.transports ?? [])
                        : draft.transport.transports?.filter(t => t.apiType !== apiType);
                draft.transport = { transports, error };
                break;
            }
            case SUITE.ONLINE_STATUS:
                draft.online = action.payload;
                break;

            case SUITE.TOR_STATUS:
                draft.torStatus = action.payload;
                break;

            case SUITE.TOR_BOOTSTRAP:
                draft.torBootstrap = action.payload;
                break;

            // no default
        }
    });

export default suiteReducer;
