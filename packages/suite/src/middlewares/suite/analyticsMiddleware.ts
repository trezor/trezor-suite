import { MiddlewareAPI } from 'redux';
import BigNumber from 'bignumber.js';
import {
    getBootloaderHash,
    getBootloaderVersion,
    getFirmwareRevision,
    getFirmwareVersion,
    isDeviceInBootloaderMode,
} from '@trezor/device-utils';
import { TRANSPORT, DEVICE } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { SUITE, ROUTER, ANALYTICS } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import { getPhysicalDeviceCount } from '@suite-utils/device';
import { getSuiteReadyPayload, redactTransactionIdFromAnchor } from '@suite-utils/analytics';

import type { AppState, Action, Dispatch } from '@suite-types';

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

        switch (action.type) {
            case SUITE.READY:
                // reporting can start when analytics is properly initialized and enabled
                analytics.report({
                    type: EventType.SuiteReady,
                    payload: getSuiteReadyPayload(state),
                });
                break;
            case ANALYTICS.ENABLE:
                if (state.suite.flags.initialRun) {
                    // suite-ready event was not reported on analytics initialization because analytics was not yet confirmed
                    analytics.report({
                        type: EventType.SuiteReady,
                        payload: getSuiteReadyPayload(state),
                    });
                }
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
                            totalInstances: state.devices.length,
                            isBitcoinOnly: action.payload.firmwareType === 'bitcoin-only',
                            totalDevices: getPhysicalDeviceCount(state.devices),
                            language: features.language,
                            model: features.model,
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
            case DISCOVERY.COMPLETE: {
                const accountsWithTransactions = state.wallet.accounts
                    .filter(account => account.history.total + (account.history.unconfirmed || 0))
                    .reduce((acc: { [key: string]: number }, obj) => {
                        const id = `${obj.symbol}_${obj.accountType}`;
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                    }, {});

                const accountsWithNonZeroBalance = state.wallet.accounts
                    .filter(account => new BigNumber(account.balance).gt(0))
                    .reduce((acc: { [key: string]: number }, obj) => {
                        const id = `${obj.symbol}_${obj.accountType}`;
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                    }, {});

                const accountsWithTokens = state.wallet.accounts
                    .filter(account => new BigNumber((account.tokens || []).length).gt(0))
                    .reduce((acc: { [key: string]: number }, obj) => {
                        acc[obj.symbol] = (acc[obj.symbol] || 0) + 1;
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
                            prevRouterUrl,
                            nextRouterUrl: action.payload.url,
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
                            prevRouterUrl,
                            nextRouterUrl: prevRouterUrl,
                            anchor: redactTransactionIdFromAnchor(action.payload),
                        },
                    });
                }
                break;
            case SUITE.AUTH_DEVICE:
                analytics.report({
                    type: EventType.SelectWalletType,
                    payload: { type: action.payload.walletNumber ? 'hidden' : 'standard' },
                });
                break;

            default:
                break;
        }
        return action;
    };

export default analyticsMiddleware;
