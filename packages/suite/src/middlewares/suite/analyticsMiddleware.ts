import { isAnyOf } from '@reduxjs/toolkit';
import { MiddlewareAPI } from 'redux';

import { firmwareUpdate } from '@suite-common/firmware';
import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { getPhysicalDeviceCount } from '@suite-common/suite-utils';
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
import { EventType, analytics } from '@trezor/suite-analytics';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { ROUTER, SUITE } from 'src/actions/suite/constants';
import { setFlag } from 'src/actions/suite/suiteActions';
import { updateLastAnonymityReportTimestamp } from 'src/actions/wallet/coinjoinAccountActions';
import { COINJOIN } from 'src/actions/wallet/constants';
import {
    selectAnonymityGainToReportByAccountKey,
    selectCoinjoinAccountByKey,
} from 'src/reducers/wallet/coinjoinReducer';
import type { Action, AppState, Dispatch } from 'src/types/suite';
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
const analyticsMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
        const prevRouterUrl = api.getState().router.url;
        // pass action
        next(action);

        const state = api.getState();

        if (isAnyOf(firmwareUpdate.fulfilled, firmwareUpdate.rejected)(action)) {
            const { device, toBtcOnly, toFwVersion, error = '' } = action.payload ?? {};

            if (device?.features) {
                analytics.report({
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
            case deviceActions.addAuthorizedDevice.type:
                analytics.report({
                    type: EventType.SelectWalletType,
                    payload: { type: action.payload.device.walletNumber ? 'hidden' : 'standard' },
                });
                break;
            case SUITE.READY:
                // reporting can start when analytics is properly initialized and enabled
                // it is done async because some UAParser queries are async
                getSuiteReadyPayload(state).then(payload => {
                    analytics.report({
                        type: EventType.SuiteReady,
                        payload,
                    });
                });
                break;
            case TRANSPORT.START:
                analytics.report({
                    type: EventType.TransportType,
                    payload: {
                        type: action.payload.type,
                        version: action.payload.version,
                    },
                });
                break;
            case DEVICE.CONNECT: {
                const {
                    device: { features, mode },
                } = action.payload;

                if (!features || !mode) return;

                if (!isDeviceInBootloaderMode(action.payload.device)) {
                    analytics.report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode,
                            firmware: getFirmwareVersion(action.payload.device),
                            firmwareRevision: getFirmwareRevision(action.payload.device),
                            bootloaderHash: getBootloaderHash(action.payload.device),
                            backup_type: features.backup_type || 'Bip39',
                            pin_protection: features.pin_protection,
                            passphrase_protection: features.passphrase_protection,
                            totalInstances: selectDevicesCount(state),
                            isBitcoinOnly: hasBitcoinOnlyFirmware(action.payload.device),
                            isBitcoinOnlyDevice: !!features?.unit_btconly,
                            totalDevices: getPhysicalDeviceCount(selectDevices(state)),
                            language: features.language,
                            model: features.internal_model,
                            optiga_sec: features.optiga_sec,
                            firmwareSource: getFirmwareSource(action.payload.device),
                        },
                    });
                } else {
                    analytics.report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode: 'bootloader',
                            firmware: getFirmwareVersion(action.payload.device),
                            bootloader: getBootloaderVersion(action.payload.device),
                            firmwareSource: getFirmwareSource(action.payload.device),
                        },
                    });
                }
                break;
            }
            case DEVICE.DISCONNECT:
                analytics.report({ type: EventType.DeviceDisconnect });
                break;
            // report when discovery finishes
            case discoveryActions.updateDiscovery.type: {
                if (action.payload.status.status !== 'complete') return;

                const accumulateAccountCountBySymbolAndType = (
                    acc: { [key: string]: number },
                    { symbol, accountType }: Account,
                ) => {
                    // change coinjoin accounts to taproot for analytics
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
                    .filter(account => new BigNumber((account.tokens || []).length).gt(0))
                    .reduce((acc: { [key: string]: number }, { symbol, tokens }) => {
                        if (
                            tokens &&
                            tokens.length > 0 &&
                            !hasVisibleTokens(symbol, tokens, state.tokenDefinitions)
                        ) {
                            return acc;
                        }

                        acc[symbol] = (acc[symbol] || 0) + 1;

                        return acc;
                    }, {});

                analytics.report({
                    type: EventType.AccountsStatus,
                    payload: { ...accountsWithTransactions },
                });

                analytics.report({
                    type: EventType.AccountsNonZeroBalance,
                    payload: { ...accountsWithNonZeroBalance },
                });

                analytics.report({
                    type: EventType.AccountsTokensStatus,
                    payload: { ...accountsWithTokens },
                });
                break;
            }
            case ROUTER.LOCATION_CHANGE:
                if (
                    state.suite.lifecycle.status !== 'initial' &&
                    state.suite.lifecycle.status !== 'loading'
                ) {
                    analytics.report({
                        type: EventType.RouterLocationChange,
                        payload: {
                            prevRouterUrl: redactRouterUrl(prevRouterUrl),
                            nextRouterUrl: redactRouterUrl(action.payload.url),
                            anchor: redactTransactionIdFromAnchor(action.payload.anchor),
                        },
                    });
                }
                break;
            case ROUTER.ANCHOR_CHANGE:
                if (action.payload) {
                    analytics.report({
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
                    analytics.report(
                        {
                            type: EventType.CoinjoinAnonymityGain,
                            payload: {
                                networkSymbol: coinjoinAccount.symbol,
                                value: anonymityGainToReport,
                            },
                        },
                        { anonymize: true },
                    );
                    api.dispatch(updateLastAnonymityReportTimestamp(action.payload.accountKey));
                }
                break;
            }

            case deviceActions.rememberDevice.type: {
                analytics.report({
                    type: action.payload.remember
                        ? EventType.SwitchDeviceRemember
                        : EventType.SwitchDeviceForget,
                });
                break;
            }

            case WALLET_SETTINGS.SET_HIDE_BALANCE: {
                if (!state.suite.flags.discreetModeCompleted) {
                    api.dispatch(setFlag('discreetModeCompleted', true));
                }
                analytics.report({
                    type: EventType.MenuToggleDiscreet,
                    payload: {
                        value: action.toggled,
                    },
                });
                break;
            }

            case WALLET_SETTINGS.CHANGE_COIN_VISIBILITY: {
                analytics.report({
                    type: EventType.SettingsCoins,
                    payload: {
                        symbol: action.payload.symbol,
                        value: action.payload.shouldBeVisible,
                    },
                });
                break;
            }

            case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS: {
                analytics.report({
                    type: EventType.SettingsGeneralChangeBitcoinUnit,
                    payload: {
                        unit: UNIT_ABBREVIATIONS[action.payload],
                    },
                });

                break;
            }

            default:
                break;
        }

        return action;
    };

export default analyticsMiddleware;
