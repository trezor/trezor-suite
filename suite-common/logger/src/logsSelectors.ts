import { A, pipe } from '@mobily/ts-belt';

import {
    AnalyticsRootState,
    selectAnalyticsInstanceId,
    selectAnalyticsSessionId,
    selectIsAnalyticsEnabled,
} from '@suite-common/analytics';
import {
    BlockchainRootState,
    DeviceRootState,
    WalletSettingsRootState,
    selectBaseCurrency,
    selectDevices,
    selectEnabledCustomBackends,
    selectEnabledNetworks,
    selectIsDiscreteModeActive,
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/wallet-core';
import { DeviceState } from '@trezor/connect';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';

import { LogsSliceRootState } from './logsSlice';
import { REDACTED_REPLACEMENT, redactAction } from './utils';

export const selectRawActionsLogsEntries = (state: LogsSliceRootState) => state.logs.logEntries;

export const selectRedactedActionsLog = (
    state: LogsSliceRootState,
    shouldHideSensitiveData: boolean,
) => {
    const rawLogEntries = selectRawActionsLogsEntries(state);

    return rawLogEntries.map(entry => {
        const metadata = {
            type: entry.type,
            datetime: entry.datetime,
        };

        let redactedAction = entry.payload;
        if (shouldHideSensitiveData) {
            redactedAction = redactAction(entry);
        }

        if (typeof redactedAction?.payload === 'object') {
            return { ...metadata, payload: { ...redactedAction.payload } };
        }

        return {
            ...metadata,
            payload: {
                ...redactedAction,
            },
        };
    });
};

export const selectRedactedDevices = (state: DeviceRootState, shouldHideSensitiveData: boolean) => {
    const devices = selectDevices(state);
    const bootloaderDevices = devices.filter(device => device.id === null);

    return pipe(
        devices,
        A.uniqBy(device => device.id),
        A.concat(bootloaderDevices),
        A.map(device => ({
            id: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.id,
            label: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.label,
            mode: device.mode,
            connected: device.connected,
            passphraseProtection: device.features?.passphrase_protection,
            model: device.features?.internal_model,
            firmware: getFirmwareVersion(device),
            firmwareRevision: getFirmwareRevision(device),
            firmwareType: device.firmwareType,
            bootloader: getBootloaderVersion(device),
            bootloaderHash: getBootloaderHash(device),
            numberOfWallets:
                device.mode !== 'bootloader'
                    ? selectDevices(state).filter(d => d.id === device.id).length
                    : 1,
        })),
    );
};

export const selectRedactedWallets = (state: DeviceRootState, shouldHideSensitiveData: boolean) =>
    pipe(
        selectDevices(state),
        A.map(device => ({
            deviceId: shouldHideSensitiveData ? REDACTED_REPLACEMENT : (device.id as DeviceState),
            deviceLabel: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.label,
            connected: device.connected,
            remember: device.remember,
            useEmptyPassphrase: shouldHideSensitiveData
                ? REDACTED_REPLACEMENT
                : device.useEmptyPassphrase,
        })),
    );

export type LogsApplicationInfoRootState = LogsSliceRootState &
    WalletSettingsRootState &
    AnalyticsRootState &
    DeviceRootState &
    BlockchainRootState;

export const selectRedactedApplicationInfo = (
    state: LogsApplicationInfoRootState,
    shouldHideSensitiveData: boolean,
) => ({
    localCurrency: selectBaseCurrency(state),
    discreetMode: selectIsDiscreteModeActive(state),
    analytics: selectIsAnalyticsEnabled(state),
    instanceId: shouldHideSensitiveData ? REDACTED_REPLACEMENT : selectAnalyticsInstanceId(state),
    sessionId: shouldHideSensitiveData ? REDACTED_REPLACEMENT : selectAnalyticsSessionId(state),
    rememberedStandardWallets: selectRememberedStandardWalletsCount(state),
    rememberedHiddenWallets: selectRememberedHiddenWalletsCount(state),
    enabledNetworks: selectEnabledNetworks(state),
    customBackends: selectEnabledCustomBackends(state),
    devices: selectRedactedDevices(state, shouldHideSensitiveData),
    wallets: selectRedactedWallets(state, shouldHideSensitiveData),
});
