import { isAddressValid } from '@suite-common/address';
import {
    WATCH_ONLY_DEVICE_ID,
    deviceActions,
    portfolioTrackerDevice,
    selectDeviceById,
    selectSelectedDevice,
} from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { type Bip43Path, getNetworkOptional } from '@suite-common/wallet-config';
import {
    accountsActions,
    changeCoinVisibility,
    selectAccountsByDeviceState,
    selectAccountsByNetworkAndDeviceState,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    getAccountIdentity,
    isAddressBasedNetwork,
    shouldUseIdentities,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { asDeviceUniquePath } from '@trezor/connect-common';

import {
    type WatchOnlyAccountImportInstruction,
    getWatchOnlyAccountImportInstructions,
    isSameWatchOnlyAccount,
    removeWatchOnlyAccountImportInstruction,
    storeWatchOnlyAccountImportInstruction,
} from 'src/utils/wallet/watchOnlyAccountStorage';

const WATCH_ONLY_ACCOUNT_ACTION_PREFIX = '@wallet/watch-only-account';
export const WATCH_ONLY_DEVICE_STATE = `state@${WATCH_ONLY_DEVICE_ID}:1` as StaticSessionId;
const virtualDeviceTemplate = portfolioTrackerDevice as AcquiredDevice;
export const watchOnlyDevice = {
    ...virtualDeviceTemplate,
    features: { ...virtualDeviceTemplate.features, label: 'Watch-only accounts' },
    id: WATCH_ONLY_DEVICE_ID,
    state: {
        staticSessionId: WATCH_ONLY_DEVICE_STATE,
    },
    label: 'Watch-only accounts',
    name: 'Watch-only accounts',
    path: asDeviceUniquePath('debug-watch-only-accounts'),
    remember: false,
} satisfies AcquiredDevice;

export const importWatchOnlyAccountThunk = createThunk<
    AccountKey,
    WatchOnlyAccountImportInstruction,
    { rejectValue: string }
>(
    `${WATCH_ONLY_ACCOUNT_ACTION_PREFIX}/import`,
    async ({ accountLabel, descriptor, symbol }, { dispatch, getState, rejectWithValue }) => {
        const network = getNetworkOptional(symbol);

        if (!network) {
            return rejectWithValue('The selected network is not supported by this Suite build.');
        }

        if (!isAddressBasedNetwork(network.networkType)) {
            return rejectWithValue('Only address-based networks support watch-only accounts.');
        }

        const normalizedDescriptor = descriptor.trim();
        const normalizedAccountLabel = accountLabel?.trim() || undefined;

        if (!normalizedDescriptor) {
            return rejectWithValue('Enter a public address or account key.');
        }

        if (!isAddressValid(normalizedDescriptor, symbol)) {
            return rejectWithValue('Enter a valid public address for the selected network.');
        }

        const existingNetworkAccounts = selectAccountsByNetworkAndDeviceState(
            getState(),
            WATCH_ONLY_DEVICE_STATE,
            symbol,
        );
        const isDuplicate = existingNetworkAccounts.some(account =>
            isSameWatchOnlyAccount(account, {
                descriptor: normalizedDescriptor,
                symbol,
            }),
        );

        if (isDuplicate) {
            return rejectWithValue('This watch-only account has already been imported.');
        }

        try {
            await dispatch(
                changeCoinVisibility({
                    symbol,
                    shouldBeVisible: true,
                }),
            ).unwrap();

            const response = await TrezorConnect.getAccountInfo({
                coin: symbol,
                descriptor: normalizedDescriptor,
                details: 'txs',
                identity: shouldUseIdentities(symbol)
                    ? getAccountIdentity({
                          deviceState: WATCH_ONLY_DEVICE_STATE,
                      })
                    : undefined,
                protocols: network.networkType === 'ethereum' ? ['erc4626'] : undefined,
                suppressBackupWarning: true,
            });

            if (!response.success) {
                return rejectWithValue(response.error.message);
            }

            let watchOnlyDeviceInstance = selectDeviceById(getState(), WATCH_ONLY_DEVICE_ID);

            if (!watchOnlyDeviceInstance) {
                dispatch(
                    deviceActions.createDeviceInstance({
                        device: watchOnlyDevice,
                        preserveState: true,
                    }),
                );
                watchOnlyDeviceInstance = selectDeviceById(getState(), WATCH_ONLY_DEVICE_ID);
            }

            if (watchOnlyDeviceInstance?.remember) {
                dispatch(
                    deviceActions.setRememberDevice({
                        device: watchOnlyDeviceInstance,
                        remember: false,
                    }),
                );
            }

            const currentNetworkAccounts = selectAccountsByNetworkAndDeviceState(
                getState(),
                WATCH_ONLY_DEVICE_STATE,
                symbol,
            );
            const nextAccountIndex =
                Math.max(-1, ...currentNetworkAccounts.map(account => account.index)) + 1;
            const createAccountAction = accountsActions.createAccount({
                accountInfo: {
                    ...response.payload,
                    descriptor: normalizedDescriptor,
                },
                accountType: 'imported',
                deviceState: WATCH_ONLY_DEVICE_STATE,
                imported: true,
                isWatchOnly: true,
                index: nextAccountIndex,
                path: (response.payload.path ?? '') as Bip43Path,
                symbol,
                visible: true,
                accountLabel: normalizedAccountLabel,
            });

            dispatch(createAccountAction);
            storeWatchOnlyAccountImportInstruction({
                accountLabel: normalizedAccountLabel,
                descriptor: normalizedDescriptor,
                symbol,
            });

            return createAccountAction.payload.key;
        } catch (error) {
            return rejectWithValue(
                error instanceof Error ? error.message : 'Unable to load the account.',
            );
        }
    },
);

export const restoreWatchOnlyAccountsThunk = createThunk<void>(
    `${WATCH_ONLY_ACCOUNT_ACTION_PREFIX}/restore`,
    async (_, { dispatch, getState }) => {
        for (const importInstruction of getWatchOnlyAccountImportInstructions()) {
            await dispatch(importWatchOnlyAccountThunk(importInstruction));
        }

        const selectedDevice = selectSelectedDevice(getState());
        if (
            selectAccountsByDeviceState(getState(), WATCH_ONLY_DEVICE_STATE).length > 0 &&
            (!selectedDevice || selectedDevice.id === WATCH_ONLY_DEVICE_ID)
        ) {
            await dispatch(selectDeviceThunk({ device: watchOnlyDevice }));
        }
    },
);

export const removeWatchOnlyAccountThunk = createThunk<void, { account: Account }>(
    `${WATCH_ONLY_ACCOUNT_ACTION_PREFIX}/remove`,
    ({ account }, { dispatch, getState }) => {
        dispatch(accountsActions.removeAccount([account]));
        removeWatchOnlyAccountImportInstruction(account);

        const remainingAccounts = selectAccountsByDeviceState(getState(), WATCH_ONLY_DEVICE_STATE);

        if (remainingAccounts.length === 0) {
            dispatch(deviceActions.forgetDevice({ device: watchOnlyDevice }));
        }
    },
);
