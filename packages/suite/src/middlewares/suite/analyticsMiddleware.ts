import { MiddlewareAPI } from 'redux';
import BigNumber from 'bignumber.js';

import { getPhysicalDeviceCount } from '@suite-common/suite-utils';
import {
    discoveryActions,
    selectDevices,
    selectDevicesCount,
    deviceActions,
} from '@suite-common/wallet-core';
import { analytics, EventType } from '@trezor/suite-analytics';
import { TRANSPORT, DEVICE } from '@trezor/connect';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isDeviceInBootloaderMode,
} from '@trezor/device-utils';

import { SUITE, ROUTER } from 'src/actions/suite/constants';
import { COINJOIN } from 'src/actions/wallet/constants';
import {
    getSuiteReadyPayload,
    redactRouterUrl,
    redactTransactionIdFromAnchor,
} from 'src/utils/suite/analytics';
import type { AppState, Action, Dispatch } from 'src/types/suite';
import {
    selectAnonymityGainToReportByAccountKey,
    selectCoinjoinAccountByKey,
} from 'src/reducers/wallet/coinjoinReducer';
import { updateLastAnonymityReportTimestamp } from 'src/actions/wallet/coinjoinAccountActions';
import { Account } from '@suite-common/wallet-types';

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

        if (deviceActions.authDevice.match(action)) {
            analytics.report({
                type: EventType.SelectWalletType,
                payload: { type: action.payload.device.walletNumber ? 'hidden' : 'standard' },
            });
        }

        switch (action.type) {
            case SUITE.READY:
                // reporting can start when analytics is properly initialized and enabled
                analytics.report({
                    type: EventType.SuiteReady,
                    payload: getSuiteReadyPayload(state),
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
                const { features, mode } = action.payload;

                if (!features || !mode) return;

                if (!isDeviceInBootloaderMode(action.payload)) {
                    analytics.report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode,
                            firmware: getFirmwareVersion(action.payload),
                            firmwareRevision: getFirmwareRevision(action.payload),
                            bootloaderHash: getBootloaderHash(action.payload),
                            backup_type: features.backup_type || 'Bip39',
                            pin_protection: features.pin_protection,
                            passphrase_protection: features.passphrase_protection,
                            totalInstances: selectDevicesCount(state),
                            isBitcoinOnly: hasBitcoinOnlyFirmware(action.payload),
                            totalDevices: getPhysicalDeviceCount(selectDevices(state)),
                            language: features.language,
                            model: features.internal_model,
                        },
                    });
                } else {
                    analytics.report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode: 'bootloader',
                            firmware: getFirmwareVersion(action.payload),
                            bootloader: getBootloaderVersion(action.payload),
                        },
                    });
                }
                break;
            }
            case DEVICE.DISCONNECT:
                analytics.report({ type: EventType.DeviceDisconnect });
                break;
            case discoveryActions.completeDiscovery.type: {
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
                            new BigNumber(
                                (account.tokens || []).filter(token =>
                                    new BigNumber(token.balance || 0).gt(0),
                                ).length,
                            ).gt(0),
                    )
                    .reduce(accumulateAccountCountBySymbolAndType, {});

                const accountsWithTokens = state.wallet.accounts
                    .filter(account => new BigNumber((account.tokens || []).length).gt(0))
                    .reduce((acc: { [key: string]: number }, { symbol }: Account) => {
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

            default:
                break;
        }

        return action;
    };

export default analyticsMiddleware;
