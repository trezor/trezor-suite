import { type UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { onSuiteInit, onSuiteReady, updateOnlineStatus } from '@suite/suite-lifecycle';
import type { CountryCode } from '@suite-common/geolocation';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TRANSPORT, type TransportInfo, isTransportEventOfType } from '@trezor/connect';

import {
    storageCorrupted,
    storageError,
    storageLoad,
} from 'src/actions/suite/storageLifecycleActions';
import {
    addDeviceIdToSeenDisconnectNotification,
    closeEvmExplanationBanner,
    confirmEvmExplanationModal,
    setRecentlyConnectedDevicePath,
    setRecentlyDisconnectedDevice,
    setSendFormPrefill,
    setSuiteError,
    setTransactionHistoryPrefill,
} from 'src/actions/suite/suiteActions';

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

const suiteReducer = (state: SuiteState = initialState, action: UnknownAction): SuiteState =>
    produce(state, draft => {
        if (storageLoad.match(action)) {
            draft.evmSettings = {
                ...draft.evmSettings,
                ...action.payload.suiteSettings?.evmSettings,
            };
            draft.seenDisconnectNotificationForDeviceIds = [
                ...draft.seenDisconnectNotificationForDeviceIds,
                ...(action.payload.suiteSettings?.seenDisconnectNotificationForDeviceIds ?? []),
            ];
        } else if (storageError.match(action)) {
            draft.lifecycle = { status: 'db-error', error: action.payload };
        } else if (storageCorrupted.match(action)) {
            draft.lifecycle = { status: 'db-corrupted', error: action.payload };
        } else if (onSuiteInit.match(action)) {
            draft.lifecycle = { status: 'loading' };
        } else if (onSuiteReady.match(action)) {
            draft.lifecycle = { status: 'ready' };
        } else if (setSuiteError.match(action)) {
            draft.lifecycle = { status: 'error', error: action.payload };
        } else if (setRecentlyConnectedDevicePath.match(action)) {
            draft.recentlyConnectedDeviceRef = action.payload;
        } else if (setRecentlyDisconnectedDevice.match(action)) {
            draft.recentlyDisconnectedDevice = action.payload;
        } else if (addDeviceIdToSeenDisconnectNotification.match(action)) {
            draft.seenDisconnectNotificationForDeviceIds = [
                ...draft.seenDisconnectNotificationForDeviceIds,
                action.payload.deviceId,
            ];
        } else if (confirmEvmExplanationModal.match(action)) {
            const { symbol, route } = action.payload;
            draft.evmSettings = {
                ...draft.evmSettings,
                confirmExplanationModalClosed: {
                    ...draft.evmSettings.confirmExplanationModalClosed,
                    [symbol]: {
                        ...draft.evmSettings.confirmExplanationModalClosed[symbol],
                        [route]: true,
                    },
                },
            };
        } else if (closeEvmExplanationBanner.match(action)) {
            draft.evmSettings = {
                ...draft.evmSettings,
                explanationBannerClosed: {
                    ...draft.evmSettings.explanationBannerClosed,
                    [action.payload]: true,
                },
            };
        } else if (setSendFormPrefill.match(action)) {
            draft.prefillFields.sendForm = action.payload.contractAddress;
        } else if (setTransactionHistoryPrefill.match(action)) {
            draft.prefillFields.transactionHistory = action.payload;
        } else if (isTransportEventOfType(action, TRANSPORT.START)) {
            const { ...transport } = action.payload;
            const transports = draft.transport?.transports ?? [];
            const index = transports.findIndex(t => t.apiType === transport.apiType);
            if (index >= 0) transports[index] = transport;
            else transports.push(transport);
            draft.transport = { transports };
        } else if (isTransportEventOfType(action, TRANSPORT.ERROR)) {
            const { apiType, error } = action.payload;
            const transports =
                !draft.transport || !apiType
                    ? (draft.transport?.transports ?? [])
                    : draft.transport.transports?.filter(t => t.apiType !== apiType);
            draft.transport = { transports, error };
        } else if (updateOnlineStatus.match(action)) {
            draft.online = action.payload;
        }
    });

export default suiteReducer;
