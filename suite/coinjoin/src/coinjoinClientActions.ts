import { type Dispatch, createAction } from '@reduxjs/toolkit';

import { type LocksRootState, selectIsDeviceLocked } from '@suite/locks';
import { type ModalRootState, closeModal, openModal, selectModal } from '@suite/modal';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { getDeviceInstances } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccounts,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import {
    type CoinjoinClientEvents,
    type CoinjoinClientVersion,
    type CoinjoinRequestEvent,
    type CoinjoinResponseEvent,
    type CoinjoinRoundEvent,
    type CoinjoinStatusEvent,
    RoundPhase,
    type SerializedCoinjoinRound,
} from '@trezor/coinjoin';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { getOsName } from '@trezor/env-utils';
import { arrayDistinct, arrayToDictionary, promiseAllSequence } from '@trezor/utils';

import * as COINJOIN from './coinjoinConstants';
import {
    type CoinjoinRootState,
    selectCoinjoinAccounts,
    selectCoinjoinClients,
    selectCoinjoinDebug,
    selectRoundsDurationInHours,
    selectRoundsLeftByAccountKey,
    selectRoundsNeededByAccountKey,
} from './coinjoinSelectors';
import { CoinjoinService } from './coinjoinService';
import { type CoinjoinAccount, type CoinjoinDebugSettings, EndRoundState } from './coinjoinTypes';
import {
    getEstimatedTimePerRound,
    getSessionDeadline,
    isCoinjoinSupportedSymbol,
    prepareCoinjoinTransaction,
} from './coinjoinUtils';
import { type CoinjoinSymbol, getCoinjoinConfig } from './config';

const clientEnable = createAction(COINJOIN.CLIENT_ENABLE, (symbol: Account['symbol']) => ({
    payload: { symbol },
}));

export const clientDisable = createAction(COINJOIN.CLIENT_DISABLE, (symbol: Account['symbol']) => ({
    payload: { symbol },
}));

const clientEnableSuccess = createAction(
    COINJOIN.CLIENT_ENABLE_SUCCESS,
    (
        symbol: Account['symbol'],
        { version, ...status }: CoinjoinStatusEvent & { version: CoinjoinClientVersion },
    ) => ({ payload: { symbol, status, version } }),
);

const clientEnableFailed = createAction(
    COINJOIN.CLIENT_ENABLE_FAILED,
    (symbol: Account['symbol']) => ({ payload: { symbol } }),
);

const clientOnStatusEvent = createAction(
    COINJOIN.CLIENT_STATUS,
    (symbol: Account['symbol'], status: CoinjoinStatusEvent) => ({
        payload: { symbol, status },
    }),
);

export const clientOnPrisonEvent = createAction(
    COINJOIN.CLIENT_PRISON_EVENT,
    (event: CoinjoinClientEvents['prison']) => ({ payload: event.prison }),
);

export const clientSessionRoundChanged = createAction(
    COINJOIN.SESSION_ROUND_CHANGED,
    (accountKey: string, round: SerializedCoinjoinRound, sessionDeadline: number) => ({
        payload: { accountKey, round, sessionDeadline },
    }),
);

export const coinjoinSessionCompleted = createAction(
    COINJOIN.SESSION_COMPLETED,
    (accountKey: string) => ({ payload: { accountKey } }),
);

const clientSessionTxSigned = createAction(
    COINJOIN.SESSION_TX_SIGNED,
    (payload: {
        accountKey: string;
        roundId: string;
        rawLiquidityClue: CoinjoinAccount['rawLiquidityClue'];
    }) => ({ payload }),
);

const clientSessionTxCandidate = createAction(
    COINJOIN.SESSION_TX_CANDIDATE,
    (accountKey: string, roundId: string) => ({ payload: { accountKey, roundId } }),
);

export const clientSessionTxBroadcasted = createAction(
    COINJOIN.SESSION_TX_BROADCASTED,
    (accountKeys: string[], round: SerializedCoinjoinRound) => ({
        payload: { accountKeys, round },
    }),
);

const clientSessionTxFailed = createAction(
    COINJOIN.SESSION_TX_FAILED,
    (accountKeys: string[], round: SerializedCoinjoinRound) => ({
        payload: { accountKeys, round },
    }),
);

export const clientSessionPhase = createAction(
    COINJOIN.CLIENT_SESSION_PHASE,
    (payload: CoinjoinClientEvents['session-phase']) => ({ payload }),
);

export const setDebugSettings = createAction(
    COINJOIN.SET_DEBUG_SETTINGS,
    (payload: CoinjoinDebugSettings) => ({ payload }),
);

export const coinjoinSessionPause = createAction(COINJOIN.SESSION_PAUSE, (accountKey: string) => ({
    payload: { accountKey },
}));

export const coinjoinAccountUnregister = createAction(
    COINJOIN.ACCOUNT_UNREGISTER,
    (accountKey: string) => ({ payload: { accountKey } }),
);

export type CoinjoinClientAction = ReturnType<
    | typeof setDebugSettings
    | typeof clientEnable
    | typeof clientDisable
    | typeof clientEnableSuccess
    | typeof clientEnableFailed
    | typeof clientOnStatusEvent
    | typeof clientOnPrisonEvent
    | typeof clientSessionRoundChanged
    | typeof coinjoinSessionCompleted
    | typeof clientSessionPhase
    | typeof clientSessionTxSigned
    | typeof clientSessionTxCandidate
    | typeof clientSessionTxBroadcasted
    | typeof clientSessionTxFailed
    | typeof coinjoinSessionPause
    | typeof coinjoinAccountUnregister
>;

// return only active instances
export const getCoinjoinClient = (symbol: CoinjoinSymbol) =>
    CoinjoinService.getInstance(symbol)?.client;

type UnregisterByAccountKeyThunkState = AccountsRootState;

export const unregisterByAccountKey =
    (accountKey: string) =>
    (_dispatch: Dispatch, getState: () => UnregisterByAccountKeyThunkState) => {
        const accounts = selectAccounts(getState());
        const realAccount = accounts.find(a => a.key === accountKey);

        const client =
            realAccount && isCoinjoinSupportedSymbol(realAccount.symbol)
                ? getCoinjoinClient(realAccount.symbol)
                : undefined;

        if (client) {
            client.unregisterAccount(accountKey);
        }
    };

export const endCoinjoinSession = (accountKey: string) => (dispatch: Dispatch) => {
    dispatch(coinjoinSessionCompleted(accountKey));
    dispatch(unregisterByAccountKey(accountKey));
};

type SetBusyScreenThunkState = AccountsRootState & DeviceRootState;

/**
 * Show "do not disconnect" screen on Trezor.
 * Multiple possible setups:
 * - 1 account on 1 device
 * - N accounts on 1 devices (like two passphrases)
 * - N accounts on X devices (like two physical device)
 */
export const setBusyScreen =
    (accountKeys: string[], expiry?: number) =>
    (_dispatch: Dispatch, getState: () => SetBusyScreenThunkState) => {
        const accounts = selectAccounts(getState());
        const devices = selectDevices(getState());

        // collect unique deviceStates from accounts (passphrase)
        const uniqueDeviceStates = accountKeys.flatMap(key => {
            const account = accounts.find(a => a.key === key);

            return account?.deviceState || [];
        });

        // collect unique physical devices (by device.id)
        const uniquePhysicalDevices = uniqueDeviceStates.reduce(
            (result, state) => {
                const device = devices.find(d => d.connected && d.state?.staticSessionId === state);
                if (device && !result.some(d => d.id === device.id)) {
                    return result.concat(device);
                }

                return result;
            },
            [] as typeof devices,
        );

        // async actions on each physical device in sequence
        return promiseAllSequence(
            uniquePhysicalDevices.map(device => () => {
                if (!expiry && !device.features?.busy) {
                    // skip unnecessary call if device is not in busy state
                    return Promise.resolve();
                }

                return TrezorConnect.setBusy({
                    device: { path: device?.path },
                    keepSession: !!expiry, // do not release device session, keep it for signTransaction
                    expiry_ms: expiry,
                });
            }),
        );
    };

type HasCriticalPhaseModalThunkState = ModalRootState;

export const hasCriticalPhaseModal =
    () => (_: Dispatch, getState: () => HasCriticalPhaseModalThunkState) => {
        const modal = selectModal(getState());

        return 'payload' in modal && modal.payload.type === 'critical-coinjoin-phase';
    };

export const closeCriticalPhaseModal = () => (dispatch: Dispatch) => {
    if (dispatch(hasCriticalPhaseModal())) {
        dispatch(closeModal());
    }
};

type PauseCoinjoinSessionThunkState = AccountsRootState;

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const pauseCoinjoinSession =
    (accountKey: AccountKey) =>
    (dispatch: Dispatch, getState: () => PauseCoinjoinSessionThunkState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account || !isCoinjoinSupportedSymbol(account.symbol)) {
            return;
        }
        // get @trezor/coinjoin client if available
        const client = getCoinjoinClient(account.symbol);

        // unregister account in @trezor/coinjoin
        client?.unregisterAccount(accountKey);

        // dispatch data to reducer
        dispatch(coinjoinSessionPause(accountKey));
    };

type StopCoinjoinSessionThunkState = AccountsRootState & CoinjoinRootState & DeviceRootState;

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const stopCoinjoinSession =
    (accountKey: AccountKey) =>
    async (dispatch: Dispatch, getState: () => StopCoinjoinSessionThunkState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account || !isCoinjoinSupportedSymbol(account.symbol)) {
            return;
        }

        // get @trezor/coinjoin client if available
        const client = getCoinjoinClient(account.symbol);
        // unregister account in @trezor/coinjoin
        client?.unregisterAccount(account.key);

        // cancelCoinjoinAuthorization should be called only if there is no other registered coinjoin account
        const devices = selectDevices(getState());
        const accounts = selectAccounts(getState());
        const coinjoinAccounts = selectCoinjoinAccounts(getState());
        const device = devices.find(d => d.state?.staticSessionId === account.deviceState);
        let shouldCancelAuthorization = device?.connected;
        if (device) {
            // find all instances of this physical device
            const deviceInstances = getDeviceInstances(device, devices);
            // find other coinjoin accounts related to this physical device
            const otherAccounts = deviceInstances.flatMap(d =>
                accounts.filter(
                    a =>
                        a.accountType === 'coinjoin' &&
                        a.key !== accountKey &&
                        a.deviceState === d.state?.staticSessionId,
                ),
            );
            // find coinjoin account with session
            const otherRegisteredAccounts = otherAccounts.flatMap(a =>
                coinjoinAccounts.filter(cja => cja.key === a.key && cja.session),
            );
            if (otherRegisteredAccounts.length > 0) {
                shouldCancelAuthorization = false;
            }
        }

        if (shouldCancelAuthorization) {
            const result = await TrezorConnect.cancelCoinjoinAuthorization({ device });

            if (!result.success) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: `Cancel coinjoin authorization ${result.error.message}`,
                    }),
                );
            }
        }

        // dispatch data to reducer
        dispatch(coinjoinAccountUnregister(accountKey));
    };

type OnCoinjoinRoundChangedThunkState = AccountsRootState & CoinjoinRootState;

export const onCoinjoinRoundChanged =
    ({ round }: CoinjoinRoundEvent) =>
    async (dispatch: Dispatch, getState: () => OnCoinjoinRoundChangedThunkState) => {
        const coinjoinAccounts = selectCoinjoinAccounts(getState());
        const roundsDurationInHours = selectRoundsDurationInHours(getState());
        // collect all account.keys from the round including failed one
        const accountKeys = round.inputs
            .concat(round.failed)
            .map(input => input.accountKey as AccountKey)
            .filter(arrayDistinct);

        const currentTimestamp = Date.now();

        const coinjoinAccountsWithSession = accountKeys
            .flatMap(
                accountKey => coinjoinAccounts.find(r => r.key === accountKey && r.session) || [],
            )
            .map(account => ({
                account,
                roundsLeft: selectRoundsLeftByAccountKey(getState(), account.key),
                roundsNeeded: selectRoundsNeededByAccountKey(getState(), account.key),
            }));

        let phaseChanged = false;
        coinjoinAccountsWithSession.forEach(({ account, roundsLeft, roundsNeeded }) => {
            if (account.session?.roundPhase !== round.phase) {
                phaseChanged = true;
            }

            const sessionDeadline = getSessionDeadline({
                currentTimestamp,
                roundDeadline: round.roundDeadline,
                timePerRound: getEstimatedTimePerRound(
                    roundsDurationInHours,
                    account.session?.skipRounds,
                ),
                roundsLeft,
                roundsNeeded,
            });

            // notify reducers
            dispatch(clientSessionRoundChanged(account.key, round, sessionDeadline));
        });

        // round event is triggered multiple times. like at the beginning and at the end of round process
        // critical actions should be triggered only once
        if (phaseChanged) {
            if (round.phase === RoundPhase.Ended) {
                await dispatch(setBusyScreen(accountKeys));
                dispatch(closeCriticalPhaseModal());

                if (round.endRoundState === EndRoundState.TransactionBroadcasted) {
                    dispatch(clientSessionTxBroadcasted(accountKeys, round));
                } else {
                    dispatch(clientSessionTxFailed(accountKeys, round));
                }

                const accountsReachingMaxRounds = coinjoinAccountsWithSession.filter(
                    ({ account: { session } }) =>
                        session?.signedRounds?.length === session?.maxRounds,
                );
                if (accountsReachingMaxRounds.length) {
                    dispatch(openModal({ type: 'more-rounds-needed' }));
                    accountsReachingMaxRounds.forEach(({ account: { key } }) => {
                        dispatch(endCoinjoinSession(key));
                    });
                }

                const accountsWithAutostop = coinjoinAccountsWithSession.filter(
                    ({ account: { key, session } }) =>
                        !accountsReachingMaxRounds.some(({ account }) => account.key === key) &&
                        session?.isAutoStopEnabled,
                );

                accountsWithAutostop.forEach(({ account: { key } }) => {
                    dispatch(stopCoinjoinSession(key));
                });
            } else if (
                round.phase > RoundPhase.InputRegistration &&
                !dispatch(hasCriticalPhaseModal())
            ) {
                await dispatch(setBusyScreen(accountKeys, round.roundDeadline - Date.now()));

                dispatch(
                    openModal({
                        type: 'critical-coinjoin-phase',
                        relatedAccountKey: coinjoinAccountsWithSession[0]?.account.key ?? '', // since all accounts share the round, any key can be used,
                    }),
                );
            }
        }
    };

// populate errors for failed subset of requested inputs
const coinjoinResponseError = (utxos: CoinjoinRequestEvent['inputs'], error: string) =>
    utxos.map(u => ({ outpoint: u.outpoint, error }));

type GetOwnershipProofThunkState = AccountsRootState &
    CoinjoinRootState &
    DeviceRootState &
    LocksRootState;

const getOwnershipProof =
    (request: Extract<CoinjoinRequestEvent, { type: 'ownership' }>) =>
    async (_dispatch: Dispatch, getState: () => GetOwnershipProofThunkState) => {
        const coinjoinAccounts = selectCoinjoinAccounts(getState());
        const accounts = selectAccounts(getState());
        const devices = selectDevices(getState());
        const isDeviceLocked = selectIsDeviceLocked(getState());

        // prepare empty response object
        const response: CoinjoinResponseEvent = {
            type: request.type,
            roundId: request.roundId,
            inputs: [],
        };

        // group utxos by account
        const groupUtxosByAccount = arrayToDictionary(
            request.inputs,
            utxo => utxo.accountKey,
            true,
        );

        // prepare array of parameters for TrezorConnect, grouped by TrezorDevice
        const groupParamsByDevice = Object.keys(groupUtxosByAccount).flatMap(key => {
            const coinjoinAccount = coinjoinAccounts.find(r => r.key === key);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key] ?? [];
            if (!coinjoinAccount || !realAccount) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account not found'));

                return [];
            }
            const { session } = coinjoinAccount;
            // do not provide ownership if requested account is no longer authorized
            if (!session || session.paused || session.signedRounds.length >= session.maxRounds) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account without session'));

                return [];
            }

            const device = devices.find(d => d.state?.staticSessionId === realAccount.deviceState);
            if (!device?.connected) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device disconnected'));

                return [];
            }

            if (isDeviceLocked) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device locked'));

                return [];
            }

            // TODO: double check if requested utxo exists in account?

            const bundle = (groupUtxosByAccount[key] ?? []).map(utxo => ({
                path: utxo.path,
                coin: asCoinSymbol(realAccount.symbol),
                commitmentData: request.commitmentData,
                userConfirmation: true,
                preauthorized: true,
            }));

            return { key, device, bundle, utxos };
        });

        // process all bundles in sequence one device by one, fill the response object
        await promiseAllSequence(
            groupParamsByDevice.map(({ device, bundle, utxos }) => async () => {
                const proof = await TrezorConnect.getOwnershipProof({ device, bundle });
                if (proof.success) {
                    proof.payload.forEach((p, i) => {
                        const utxo = utxos[i];
                        if (!utxo) return; // double check if data from Trezor corresponds with request
                        response.inputs.push({
                            outpoint: utxo.outpoint,
                            ownershipProof: p.ownership_proof,
                        });
                    });

                    return;
                }
                utxos.forEach(u => {
                    response.inputs.push({
                        outpoint: u.outpoint,
                        error: proof.error?.message,
                    });
                });
            }),
        );

        // finally walk thru all requested utxos and find not resolved
        request.inputs.forEach(utxo => {
            if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
                response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
            }
        });

        return response;
    };

interface ClientEmitExceptionOptions {
    symbol?: Account['symbol'];
}

// use CoinjoinClient emitter to log/throw exceptions
// exceptions will be reported to sentry in suite-desktop build
export const clientEmitException =
    (reason: string, options: ClientEmitExceptionOptions = {}) =>
    () => {
        (options.symbol && isCoinjoinSupportedSymbol(options.symbol)
            ? [CoinjoinService.getInstance(options.symbol)]
            : CoinjoinService.getInstances()
        ).forEach(instance => {
            instance?.client.emit('log', { level: 'error', payload: reason });
        });
    };

type SignCoinjoinTxThunkState = AccountsRootState &
    CoinjoinRootState &
    DeviceRootState &
    WalletSettingsRootState;

const signCoinjoinTx =
    (request: Extract<CoinjoinRequestEvent, { type: 'signature' }>) =>
    async (dispatch: Dispatch, getState: () => SignCoinjoinTxThunkState) => {
        const coinjoinAccounts = selectCoinjoinAccounts(getState());
        const accounts = selectAccounts(getState());
        const devices = selectDevices(getState());
        const addressDisplayType = selectAddressDisplayType(getState());

        // prepare empty response object
        const response: CoinjoinResponseEvent = {
            type: request.type,
            roundId: request.roundId,
            inputs: [],
        };

        // group utxos by account
        const groupUtxosByAccount = arrayToDictionary(
            request.inputs,
            utxo => utxo.accountKey,
            true,
        );

        const groupParamsByDevice = Object.keys(groupUtxosByAccount).flatMap(key => {
            const coinjoinAccount = coinjoinAccounts.find(r => r.key === key);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key] ?? [];
            if (!coinjoinAccount || !realAccount) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account not found'));

                return [];
            }

            const { session, rawLiquidityClue } = coinjoinAccount;
            if (!session || session.signedRounds.length >= session.maxRounds) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account without session'));

                return [];
            }

            const device = devices.find(d => d.state?.staticSessionId === realAccount.deviceState);
            if (!device?.connected) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device disconnected'));

                return [];
            }

            const tx = prepareCoinjoinTransaction(realAccount, request.transaction);

            return {
                device,
                unlockPath: realAccount.unlockPath,
                tx,
                utxos,
                roundId: request.roundId,
                key,
                network: realAccount.symbol,
                rawLiquidityClue,
            };
        });

        // sign all transactions in sequence one device by one, fill the response object
        await promiseAllSequence(
            groupParamsByDevice.map(
                ({ device, tx, utxos, roundId, key, network, unlockPath, rawLiquidityClue }) =>
                    async () => {
                        // notify reducer before signing, failed signing are also counted in Trezor maxRound limit
                        dispatch(
                            clientSessionTxSigned({
                                accountKey: key,
                                roundId,
                                rawLiquidityClue:
                                    request.liquidityClues.find(l => l.accountKey === key)
                                        ?.rawLiquidityClue || rawLiquidityClue,
                            }),
                        );

                        const signTx = await TrezorConnect.signTransaction({
                            version: 1, // Coinjoin requires the 1, the default is now 2, as most wallets have 2
                            device,
                            inputs: tx.inputs,
                            outputs: tx.outputs,
                            coinjoinRequest: tx.coinjoinRequest,
                            coin: asCoinSymbol(network),
                            preauthorized: true,
                            serialize: false,
                            unlockPath,
                            chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
                        });

                        if (signTx.success) {
                            let utxoIndex = 0;
                            tx.inputs.forEach((input, index) => {
                                const utxo = utxos[utxoIndex];
                                const signature = signTx.payload.signatures[index];
                                if (input.script_type !== 'EXTERNAL' && utxo && signature) {
                                    response.inputs.push({
                                        outpoint: utxo.outpoint,
                                        signature,
                                        index,
                                    });
                                    utxoIndex++;
                                }
                            });

                            // create tx candidate
                            dispatch(clientSessionTxCandidate(key, roundId));

                            return;
                        }

                        const fwVersion = `${device?.features?.major_version}.${device?.features?.minor_version}.${device?.features?.patch_version}-${device?.features?.revision}`;
                        utxos.forEach(u => {
                            response.inputs.push({
                                outpoint: u.outpoint,
                                error: `${fwVersion} (${getOsName()}) ${signTx.error.message}`,
                            });
                        });

                        dispatch(
                            notificationsActions.addToast({
                                type: 'error',
                                error: `Coinjoin signTransaction: ${signTx.error.message}`,
                            }),
                        );
                    },
            ),
        );

        // disable busy screen
        await dispatch(setBusyScreen(Object.keys(groupUtxosByAccount)));
        // and close 'critical-coinjoin-phase' modal
        dispatch(closeCriticalPhaseModal());

        // finally walk thru all requested utxos and find not resolved
        request.inputs.forEach(utxo => {
            if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
                response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
            }
        });

        return response;
    };

export const onCoinjoinClientRequest = (data: CoinjoinRequestEvent[]) => (dispatch: Dispatch) =>
    Promise.all(
        data.map(request => {
            if (request.type === 'ownership') {
                return dispatch(getOwnershipProof(request));
            }
            if (request.type === 'signature') {
                return dispatch(signCoinjoinTx(request));
            }

            return request;
        }),
    );

type InitCoinjoinServiceThunkState = AccountsRootState & CoinjoinRootState & MessageSystemRootState;

export const initCoinjoinService =
    (symbol: Account['symbol']) =>
    async (dispatch: Dispatch, getState: () => InitCoinjoinServiceThunkState) => {
        const clients = selectCoinjoinClients(getState());
        const debug = selectCoinjoinDebug(getState());
        const accounts = selectCoinjoinAccounts(getState());

        if (!isCoinjoinSupportedSymbol(symbol)) return;

        const knownClient = clients[symbol];
        if (knownClient?.status === 'loading') return;

        // find already running instance of @trezor/coinjoin client
        const knownService = CoinjoinService.getInstance(symbol);
        if (knownService && knownClient?.status === 'loaded') {
            return knownService;
        }

        const isCoinjoinDisabledByFeatureFlag = selectIsFeatureDisabled(
            getState(),
            Feature.coinjoin,
        );
        // retry if client was not enabled properly until now
        if (knownService && knownClient?.status === 'unavailable') {
            if (!isCoinjoinDisabledByFeatureFlag) {
                const status = await knownService.client.enable();
                if (status.success) {
                    dispatch(clientEnableSuccess(symbol, status));
                }
            }

            return knownService;
        }

        const environment = debug?.coinjoinServerEnvironment?.[symbol];

        // or start new instance
        dispatch(clientEnable(symbol));

        // restore CoinjoinPrison initialState
        const prison = accounts
            .filter(account => account.symbol === symbol && account.prison)
            .flatMap(account => {
                const realAccount = selectAccountByKey(getState(), account.key);
                if (!realAccount) return [];

                const utxos = realAccount.utxo!.map(getUtxoOutpoint);
                const usedChange = realAccount
                    .addresses!.change.filter(a => a.transfers > 0)
                    .map(a => a.address);

                return Object.entries(account.prison ?? {}).flatMap(([id, inmate]) => {
                    // clear outdated info with Infinity sentence
                    if (inmate.sentenceEnd === Infinity) {
                        // utxos which are no longer in account (spent utxos)
                        if (inmate.type === 'input' && !utxos.includes(id)) {
                            return [];
                        }
                        // change addresses with transfers (used addresses)
                        if (inmate.type === 'output' && usedChange.includes(id)) {
                            return [];
                        }
                    }

                    return {
                        id,
                        accountKey: account.key,
                        ...inmate,
                    };
                });
            });

        try {
            const config = getCoinjoinConfig(symbol, environment);
            const service = await CoinjoinService.createInstance({
                symbol,
                prison,
                settings: { ...config, ...debug?.coinjoinConfigOverride?.[symbol] },
            });
            if (isCoinjoinDisabledByFeatureFlag) {
                dispatch(clientEnableFailed(symbol));

                return service;
            }
            const { client } = service;
            const status = await client.enable();
            // handle status change
            client.on('status', status => dispatch(clientOnStatusEvent(symbol, status)));
            // handle prison event
            client.on('prison', event => dispatch(clientOnPrisonEvent(event)));
            // handle active round change
            client.on('round', event => dispatch(onCoinjoinRoundChanged(event)));
            // handle requests (ownership proof, sign transaction)
            client.on('request', async data => {
                const response = await dispatch(onCoinjoinClientRequest(data));
                client.resolveRequest(response);
            });
            // handle session phase change
            client.on('session-phase', event => dispatch(clientSessionPhase(event)));

            if (!status.success) {
                dispatch(clientEnableFailed(symbol));
            } else {
                dispatch(clientEnableSuccess(symbol, status));
            }

            return service;
        } catch (error) {
            CoinjoinService.removeInstance(symbol);
            dispatch(clientDisable(symbol));
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `CoinjoinClient ${error.message}`,
                }),
            );
        }
    };
