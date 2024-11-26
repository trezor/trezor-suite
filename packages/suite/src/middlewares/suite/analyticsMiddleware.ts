import { MiddlewareAPI } from 'redux';
import { isAnyOf } from '@reduxjs/toolkit';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { getPhysicalDeviceCount } from '@suite-common/suite-utils';
import {
    discoveryActions,
    selectDevices,
    selectDevicesCount,
    authorizeDeviceThunk,
    deviceActions,
} from '@suite-common/wallet-core';
import {
    firmwareActions,
    handleFwHashError,
    INVALID_HASH_ERROR,
    firmwareUpdate,
} from '@suite-common/firmware';
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
import { Account } from '@suite-common/wallet-types';

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

        if (authorizeDeviceThunk.fulfilled.match(action)) {
            analytics.report({
                type: EventType.SelectWalletType,
                payload: { type: action.payload.device.walletNumber ? 'hidden' : 'standard' },
            });
        }

        if (handleFwHashError.fulfilled.match(action)) {
            analytics.report({
                type: EventType.FirmwareValidateHashError,
                payload: {
                    error: action.meta.arg.errorMessage,
                },
            });
        }

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
                    },
                });
            }
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
                            totalDevices: getPhysicalDeviceCount(selectDevices(state)),
                            language: features.language,
                            model: features.internal_model,
                            optiga_sec: features.optiga_sec,
                        },
                    });
                } else {
                    analytics.report({
                        type: EventType.DeviceConnect,
                        payload: {
                            mode: 'bootloader',
                            firmware: getFirmwareVersion(action.payload.device),
                            bootloader: getBootloaderVersion(action.payload.device),
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

            case deviceActions.rememberDevice.type: {
                analytics.report({
                    type: action.payload.remember
                        ? EventType.SwitchDeviceRemember
                        : EventType.SwitchDeviceForget,
                });
                break;
            }

            case firmwareActions.setFirmwareUpdateError.type: {
                if (action.payload === INVALID_HASH_ERROR) {
                    analytics.report({
                        type: EventType.FirmwareValidateHashMismatch,
                    });
                }
                break;
            }

            default:
                break;
        }

        return action;
    };

export default analyticsMiddleware;
