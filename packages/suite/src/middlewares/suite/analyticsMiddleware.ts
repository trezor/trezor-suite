import { isAnyOf } from '@reduxjs/toolkit';

import { asTypedDesktopAnalytics, events } from '@suite/analytics';
import { anchorChange, routerLocationChange, selectRouterUrl } from '@suite/router';
import { deviceActions, selectDevices, selectDevicesCount } from '@suite-common/device';
import { firmwareUpdate } from '@suite-common/firmware';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import {
    getIsDeviceDescriptorApiTypeBluetooth,
    getPhysicalDeviceCount,
} from '@suite-common/suite-utils';
import { WALLET_SETTINGS, discoveryActions } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    accumulateAccountCountBySymbolAndType,
    getAccountTotalStakingBalance,
    getAccountsWithSomeTransactionHistory,
} from '@suite-common/wallet-utils';
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
import { BigNumber } from '@trezor/utils';

import { SUITE } from 'src/actions/suite/constants';
import { setFlag } from 'src/actions/suite/suiteActions';
import { updateLastAnonymityReportTimestamp } from 'src/actions/wallet/coinjoinAccountActions';
import { COINJOIN } from 'src/actions/wallet/constants';
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
        const { analytics } = extra.services;

        if (isAnyOf(firmwareUpdate.fulfilled, firmwareUpdate.rejected)(action)) {
            const { device, toBtcOnly, toFwVersion, error = '' } = action.payload ?? {};

            if (device?.features) {
                asTypedDesktopAnalytics(analytics).report({
                    type: events.deviceUpdateFirmwareEvent.name,
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
            case deviceActions.addAuthorizedDevice.type:
                asTypedDesktopAnalytics(analytics).report({
                    type: events.selectWalletTypeEvent.name,
                    payload: {
                        type: action.payload.device.walletNumber ? 'hidden' : 'standard',
                    },
                });
                break;

            case SUITE.READY:
                getSuiteReadyPayload(state).then(payload => {
                    asTypedDesktopAnalytics(analytics).report({
                        type: events.suiteReadyEvent.name,
                        payload,
                    });
                });
                break;

            case TRANSPORT.START:
                asTypedDesktopAnalytics(analytics).report({
                    type: events.transportTypeEvent.name,
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
                    asTypedDesktopAnalytics(analytics).report({
                        type: events.deviceConnectEvent.name,
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
                    asTypedDesktopAnalytics(analytics).report({
                        type: events.deviceConnectEvent.name,
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
                asTypedDesktopAnalytics(analytics).report({
                    type: events.deviceDisconnectEvent.name,
                });
                break;

            case discoveryActions.updateDiscovery.type: {
                if (action.payload.status.status !== 'complete') return result;

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

                asTypedDesktopAnalytics(analytics).report({
                    type: events.accountsStatusEvent.name,
                    payload: getAccountsWithSomeTransactionHistory(state.wallet.accounts).reduce(
                        accumulateAccountCountBySymbolAndType,
                        {},
                    ),
                });

                asTypedDesktopAnalytics(analytics).report({
                    type: events.accountsNonZeroBalanceEvent.name,
                    payload: accountsWithNonZeroBalance,
                });

                asTypedDesktopAnalytics(analytics).report({
                    type: events.accountsTokensStatusEvent.name,
                    payload: accountsWithTokens,
                });

                asTypedDesktopAnalytics(analytics).report({
                    type: events.accountsActiveStakingEvent.name,
                    payload: accountsWithStaking,
                });

                break;
            }

            case routerLocationChange.type:
                if (
                    state.suite.lifecycle.status !== 'initial' &&
                    state.suite.lifecycle.status !== 'loading'
                ) {
                    asTypedDesktopAnalytics(analytics).report({
                        type: events.routerLocationChangeEvent.name,
                        payload: {
                            prevRouterUrl: redactRouterUrl(prevRouterUrl),
                            nextRouterUrl: redactRouterUrl(selectRouterUrl(state)),
                            anchor: redactTransactionIdFromAnchor(action.payload.anchor),
                        },
                    });
                }
                break;

            case anchorChange.type:
                if (action.payload) {
                    asTypedDesktopAnalytics(analytics).report({
                        type: events.routerLocationChangeEvent.name,
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
                    action.payload.accountKey as AccountKey,
                );
                const anonymityGainToReport = selectAnonymityGainToReportByAccountKey(
                    state,
                    action.payload.accountKey as AccountKey,
                );

                if (coinjoinAccount && anonymityGainToReport !== null) {
                    asTypedDesktopAnalytics(analytics).report(
                        {
                            type: events.coinjoinAnonymityGainEvent.name,
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
                asTypedDesktopAnalytics(analytics).report({
                    type: action.payload.remember
                        ? events.switchDeviceRememberEvent.name
                        : events.switchDeviceForgetEvent.name,
                });
                break;

            case WALLET_SETTINGS.SET_HIDE_BALANCE:
                if (!state.suite.flags.discreetModeCompleted) {
                    dispatch(setFlag('discreetModeCompleted', true));
                }
                asTypedDesktopAnalytics(analytics).report({
                    type: events.menuToggleDiscreetEvent.name,
                    payload: { value: action.toggled },
                });
                break;

            case WALLET_SETTINGS.CHANGE_COIN_VISIBILITY:
                asTypedDesktopAnalytics(analytics).report({
                    type: events.settingsCoinsEvent.name,
                    payload: {
                        symbol: action.payload.symbol,
                        value: action.payload.shouldBeVisible,
                    },
                });
                break;

            case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                asTypedDesktopAnalytics(analytics).report({
                    type: events.settingsGeneralChangeBitcoinUnitEvent.name,
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
