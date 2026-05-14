import { A, pipe } from '@mobily/ts-belt';

import {
    type AnalyticsRootState,
    selectAnalyticsInstanceId,
    selectAnalyticsSessionId,
    selectIsAnalyticsEnabled,
} from '@suite-common/analytics-redux';
import {
    type DeviceRootState,
    selectDevices,
    selectRememberedHiddenWalletsCount,
    selectRememberedStandardWalletsCount,
} from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type BlockchainRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectEnabledCustomBackends,
    selectEnabledNetworks,
    selectIsDiscreteModeActive,
} from '@suite-common/wallet-core';
import { type DeviceState } from '@trezor/connect';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
} from '@trezor/device-utils';

import { type LogsSliceRootState } from './logsSlice';
import { REDACTED_REPLACEMENT, redactAction } from './utils';

export type LogsApplicationInfoRootState = LogsSliceRootState &
    WalletSettingsRootState &
    AnalyticsRootState &
    DeviceRootState &
    BlockchainRootState;

const createActionsLogsMemoizedSelector = createWeakMapSelector.withTypes<LogsSliceRootState>();
const createApplicationInfoLogsMemoizedSelector =
    createWeakMapSelector.withTypes<LogsApplicationInfoRootState>();

export const selectRawActionsLogsEntries = (state: LogsSliceRootState) => state.logs.logEntries;

export const selectRedactedActionsLog = createActionsLogsMemoizedSelector(
    [
        selectRawActionsLogsEntries,
        (_state, shouldHideSensitiveData?: boolean) => shouldHideSensitiveData,
    ],
    (rawActionsLogsEntries, shouldHideSensitiveData) =>
        returnStableArrayIfEmpty(
            rawActionsLogsEntries.map(entry => {
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
            }),
        ),
);

export const selectRedactedDevices = createApplicationInfoLogsMemoizedSelector(
    [selectDevices, (_state, shouldHideSensitiveData?: boolean) => shouldHideSensitiveData],
    (devices, shouldHideSensitiveData) => {
        const bootloaderDevices = devices.filter(device => device.id === null);

        return pipe(
            devices,
            A.uniqBy(device => device.id),
            A.concat(bootloaderDevices),
            A.map(device => ({
                id: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.id,
                label: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.label,
                path: device.path, // needed to load telemetry
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
                        ? devices.filter(d => d.id === device.id).length
                        : 1,
            })),
        );
    },
);
export type RedactedDevice = ReturnType<typeof selectRedactedDevices>[number];

export const selectRedactedWallets = createApplicationInfoLogsMemoizedSelector(
    [selectDevices, (_state, shouldHideSensitiveData?: boolean) => shouldHideSensitiveData],
    (devices, shouldHideSensitiveData) =>
        pipe(
            devices,
            A.map(device => ({
                deviceId: shouldHideSensitiveData
                    ? REDACTED_REPLACEMENT
                    : (device.id as DeviceState),
                deviceLabel: shouldHideSensitiveData ? REDACTED_REPLACEMENT : device.label,
                connected: device.connected,
                remember: device.remember,
                useEmptyPassphrase: shouldHideSensitiveData
                    ? REDACTED_REPLACEMENT
                    : device.useEmptyPassphrase,
            })),
        ),
);

export const selectRedactedApplicationInfo = createApplicationInfoLogsMemoizedSelector(
    [
        selectBaseCurrency,
        selectIsDiscreteModeActive,
        selectIsAnalyticsEnabled,
        selectAnalyticsInstanceId,
        selectAnalyticsSessionId,
        selectRememberedStandardWalletsCount,
        selectRememberedHiddenWalletsCount,
        selectEnabledNetworks,
        selectEnabledCustomBackends,
        selectRedactedDevices,
        selectRedactedWallets,
        (_state, shouldHideSensitiveData?: boolean) => shouldHideSensitiveData,
    ],
    (
        localCurrency,
        discreetMode,
        analytics,
        instanceId,
        sessionId,
        rememberedStandardWallets,
        rememberedHiddenWallets,
        enabledNetworks,
        customBackends,
        devices,
        wallets,
        shouldHideSensitiveData,
    ) => ({
        localCurrency,
        discreetMode,
        analytics,
        rememberedStandardWallets,
        rememberedHiddenWallets,
        enabledNetworks,
        customBackends,
        devices,
        wallets,
        instanceId: shouldHideSensitiveData ? REDACTED_REPLACEMENT : instanceId,
        sessionId: shouldHideSensitiveData ? REDACTED_REPLACEMENT : sessionId,
    }),
);
