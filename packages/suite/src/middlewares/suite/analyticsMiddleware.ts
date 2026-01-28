import { isAnyOf } from '@reduxjs/toolkit';

import {
    EventType,
    getTypedDesktopAnalytics,
    getTypedDesktopLegacyAnalytics,
} from '@suite/analytics';
import { EventType as EventTypeShared } from '@suite-common/analytics-types';
import { firmwareUpdate } from '@suite-common/firmware';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import {
    getIsDeviceDescriptorApiTypeBluetooth,
    getPhysicalDeviceCount,
} from '@suite-common/suite-utils';
import { connectThpDeviceThunk } from '@suite-common/thp';
import {
    WALLET_SETTINGS,
    deviceActions,
    discoveryActions,
    selectDevices,
    selectDevicesCount,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { DEVICE, TRANSPORT } from '@trezor/connect';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareSource,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isDeviceInBootloaderMode,
} from '@trezor/device-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { setFlag } from 'src/actions/suite/suiteActions';
import { updateLastAnonymityReportTimestamp } from 'src/actions/wallet/coinjoinAccountActions';
import { COINJOIN } from 'src/actions/wallet/constants';
import { selectRouterUrl } from 'src/reducers/suite/routerReducer';
import {
    selectAnonymityGainToReportByAccountKey,
    selectCoinjoinAccountByKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { Action, AppState } from 'src/types/suite';
import {
    getSuiteReadyPayload,
    redactRouterUrl,
    redactTransactionIdFromAnchor,
} from 'src/utils/suite/analytics';
import { hasVisibleTokens } from 'src/utils/wallet/tokenUtils';

/*
    In analytics middleware we may intercept actions we would like to log. For example:
    - trezor model
    - firmware version
    - transport (webusb/bridge) and its version
    - backup type (shamir/bip39)
*/
const analyticsMiddleware = createMiddlewareWithExtraDeps(
    (action: Action, { extra, next, dispatch, getState }) => {
        const prevRouterUrl = selectRouterUrl(getState());

        // NOTE: pass action on, keep the result
        const result = next(action);

        const state: AppState = getState();
        const { legacyAnalytics, analytics } = extra.services;

        if (isAnyOf(firmwareUpdate.fulfilled, firmwareUpdate.rejected)(action)) {
            const { device, toBtcOnly, toFwVersion, error = '' } = action.payload ?? {};

            if (device?.features) {
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.DeviceUpdateFirmware,
                    payload: {
                        model: device.features.internal_model,
                        fromFwVersion:
                            device?.firmware === 'none' ? 'none' : getFirmwareVersion(device),
                        fromBlVersion: getBootloaderVersion(device),
                        error,
                        toBtcOnly,
                        toFwVersion,
                        firmwareSource: getFirmwareSource(device),
                    },
                });
            }
        }

        switch (action.type) {
            case connectThpDeviceThunk.fulfilled.type:
                legacyAnalytics.report({
                    type: EventTypeShared.DeviceConnectionDeviceConfirmation,
                    payload: { option: 'confirmed' },
                });
                break;

            case deviceActions.addAuthorizedDevice.type:
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.SelectWalletType,
                    payload: {
                        type: action.payload.device.walletNumber ? 'hidden' : 'standard',
                    },
                });
                break;

            case SUITE.READY:
                getSuiteReadyPayload(state).then(payload => {
                    getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                        type: EventType.SuiteReady,
                        payload,
                    });
                });
                break;

            case TRANSPORT.START:
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.TransportType,
                    payload: {
                        type: action.payload.type,
                        version: action.payload.version,
                    },
                });
                break;

            case DEVICE.CONNECT: {
                const { device } = action.payload;
                const { features, mode } = device;

                if (!features || !mode) return result;

                if (!isDeviceInBootloaderMode(device)) {
                    getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode,
                            firmware: getFirmwareVersion(device),
                            firmwareRevision: getFirmwareRevision(device),
                            bootloaderHash: getBootloaderHash(device),
                            backup_type: features.backup_type || 'Bip39',
                            pin_protection: features.pin_protection,
                            passphrase_protection: features.passphrase_protection,
                            totalInstances: selectDevicesCount(state),
                            isBitcoinOnly: hasBitcoinOnlyFirmware(device),
                            isBitcoinOnlyDevice: !!features.unit_btconly,
                            totalDevices: getPhysicalDeviceCount(selectDevices(state)),
                            language: features.language,
                            model: features.internal_model,
                            optiga_sec: features.optiga_sec,
                            firmwareSource: getFirmwareSource(device),
                            connectionType: getIsDeviceDescriptorApiTypeBluetooth(device)
                                ? 'bluetooth'
                                : 'cable',
                        },
                    });
                } else {
                    getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode: 'bootloader',
                            firmware: getFirmwareVersion(device),
                            bootloader: getBootloaderVersion(device),
                            firmwareSource: getFirmwareSource(device),
                        },
                    });
                }
                break;
            }

            case DEVICE.DISCONNECT:
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.DeviceDisconnect,
                });
                break;

            case discoveryActions.updateDiscovery.type: {
                if (action.payload.status.status !== 'complete') return result;

                const accumulateAccountCountBySymbolAndType = (
                    acc: Record<string, number>,
                    { symbol, accountType }: Account,
                ) => {
                    const accType = accountType === 'coinjoin' ? 'taproot' : accountType;
                    const id = `${symbol}_${accType}`;
                    acc[id] = (acc[id] || 0) + 1;

                    return acc;
                };

                const accountsWithTransactions = state.wallet.accounts
                    .filter(account => account.history.total + (account.history.unconfirmed || 0))
                    .reduce(accumulateAccountCountBySymbolAndType, {});

                const accountsWithNonZeroBalance = state.wallet.accounts
                    .filter(
                        account =>
                            new BigNumber(account.balance).gt(0) ||
                            new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0) ||
                            hasVisibleTokens(
                                account.symbol,
                                account.tokens ?? [],
                                state.tokenDefinitions,
                            ),
                    )
                    .reduce(accumulateAccountCountBySymbolAndType, {});

                const accountsWithTokens = state.wallet.accounts
                    .filter(account => new BigNumber(account.tokens?.length || 0).gt(0))
                    .reduce<Record<string, number>>((acc, { symbol, tokens }) => {
                        if (
                            tokens?.length &&
                            !hasVisibleTokens(symbol, tokens, state.tokenDefinitions)
                        ) {
                            return acc;
                        }
                        acc[symbol] = (acc[symbol] || 0) + 1;

                        return acc;
                    }, {});

                const accountsWithStaking = state.wallet.accounts
                    .filter(account =>
                        new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0),
                    )
                    .reduce(accumulateAccountCountBySymbolAndType, {});

                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.AccountsStatus,
                    payload: accountsWithTransactions,
                });

                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.AccountsNonZeroBalance,
                    payload: accountsWithNonZeroBalance,
                });

                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.AccountsTokensStatus,
                    payload: accountsWithTokens,
                });

                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.AccountsActiveStaking,
                    payload: accountsWithStaking,
                });

                break;
            }

            case ROUTER.LOCATION_CHANGE:
                if (
                    state.suite.lifecycle.status !== 'initial' &&
                    state.suite.lifecycle.status !== 'loading'
                ) {
                    getTypedDesktopAnalytics(analytics).report({
                        type: EventType.RouterLocationChange,
                        payload: {
                            prevRouterUrl: redactRouterUrl(prevRouterUrl),
                            nextRouterUrl: redactRouterUrl(selectRouterUrl(state)),
                            anchor: redactTransactionIdFromAnchor(action.payload.anchor),
                        },
                    });
                }
                break;

            case ROUTER.ANCHOR_CHANGE:
                if (action.payload) {
                    getTypedDesktopAnalytics(analytics).report({
                        type: EventType.RouterLocationChange,
                        payload: {
                            prevRouterUrl: redactRouterUrl(prevRouterUrl),
                            nextRouterUrl: redactRouterUrl(prevRouterUrl),
                            anchor: redactTransactionIdFromAnchor(action.payload),
                        },
                    });
                }
                break;

            case COINJOIN.SESSION_COMPLETED:
            case COINJOIN.SESSION_PAUSE:
            case COINJOIN.ACCOUNT_UNREGISTER: {
                const coinjoinAccount = selectCoinjoinAccountByKey(
                    state,
                    action.payload.accountKey,
                );
                const anonymityGainToReport = selectAnonymityGainToReportByAccountKey(
                    state,
                    action.payload.accountKey,
                );

                if (coinjoinAccount && anonymityGainToReport !== null) {
                    getTypedDesktopLegacyAnalytics(legacyAnalytics).report(
                        {
                            type: EventType.CoinjoinAnonymityGain,
                            payload: {
                                networkSymbol: coinjoinAccount.symbol,
                                value: anonymityGainToReport,
                            },
                        },
                        { anonymize: true },
                    );
                    dispatch(updateLastAnonymityReportTimestamp(action.payload.accountKey));
                }
                break;
            }

            case deviceActions.setRememberDevice.type:
                getTypedDesktopAnalytics(analytics).report({
                    type: action.payload.remember
                        ? EventType.SwitchDeviceRemember
                        : EventType.SwitchDeviceForget,
                });
                break;

            case WALLET_SETTINGS.SET_HIDE_BALANCE:
                if (!state.suite.flags.discreetModeCompleted) {
                    dispatch(setFlag('discreetModeCompleted', true));
                }
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.MenuToggleDiscreet,
                    payload: { value: action.toggled },
                });
                break;

            case WALLET_SETTINGS.CHANGE_COIN_VISIBILITY:
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.SettingsCoins,
                    payload: {
                        symbol: action.payload.symbol,
                        value: action.payload.shouldBeVisible,
                    },
                });
                break;

            case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                getTypedDesktopLegacyAnalytics(legacyAnalytics).report({
                    type: EventType.SettingsGeneralChangeBitcoinUnit,
                    payload: {
                        unit: UNIT_ABBREVIATIONS[action.payload],
                    },
                });
                break;

            default:
                break;
        }

        return result;
    },
);

export default analyticsMiddleware;
