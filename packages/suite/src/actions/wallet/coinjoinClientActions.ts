import TrezorConnect from '@trezor/connect';
import {
    CoinjoinStatusEvent,
    CoinjoinRoundEvent,
    SerializedCoinjoinRound,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
    CoinjoinClientEvents,
} from '@trezor/coinjoin';
import { SUITE } from 'src/actions/suite/constants';
import { arrayDistinct, arrayToDictionary, promiseAllSequence } from '@trezor/utils';
import * as COINJOIN from './constants/coinjoinConstants';
import {
    prepareCoinjoinTransaction,
    getSessionDeadline,
    getEstimatedTimePerRound,
} from 'src/utils/wallet/coinjoinUtils';
import { CoinjoinService } from 'src/services/coinjoin';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { Dispatch, GetState } from 'src/types/suite';
import { Account } from '@suite-common/wallet-types';
import {
    RoundPhase,
    CoinjoinAccount,
    EndRoundState,
    CoinjoinDebugSettings,
} from 'src/types/wallet/coinjoin';
import { onCancel as closeModal, openModal } from 'src/actions/suite/modalActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    selectRoundsNeededByAccountKey,
    selectRoundsLeftByAccountKey,
    selectRoundsDurationInHours,
    selectCoinjoinAccounts,
} from 'src/reducers/wallet/coinjoinReducer';

const clientEnable = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE,
        payload: {
            symbol,
        },
    } as const);

export const clientDisable = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_DISABLE,
        payload: {
            symbol,
        },
    } as const);

const clientEnableSuccess = (symbol: Account['symbol'], status: CoinjoinStatusEvent) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_SUCCESS,
        payload: {
            symbol,
            status,
        },
    } as const);

const clientEnableFailed = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_FAILED,
        payload: {
            symbol,
        },
    } as const);

const clientOnStatusEvent = (symbol: Account['symbol'], status: CoinjoinStatusEvent) =>
    ({
        type: COINJOIN.CLIENT_STATUS,
        payload: {
            symbol,
            status,
        },
    } as const);

const clientOnPrisonEvent = (event: CoinjoinClientEvents['prison']) =>
    ({
        type: COINJOIN.CLIENT_PRISON_EVENT,
        payload: event.prison,
    } as const);

const clientSessionRoundChanged = (
    accountKey: string,
    round: SerializedCoinjoinRound,
    sessionDeadline: number,
) =>
    ({
        type: COINJOIN.SESSION_ROUND_CHANGED,
        payload: {
            accountKey,
            round,
            sessionDeadline,
        },
    } as const);

const clientSessionCompleted = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_COMPLETED,
        payload: {
            accountKey,
        },
    } as const);

const clientSessionOwnership = (accountKey: string, roundId: string) =>
    ({
        type: COINJOIN.SESSION_OWNERSHIP,
        payload: {
            accountKey,
            roundId,
        },
    } as const);

const clientSessionTxSigned = (payload: {
    accountKey: string;
    roundId: string;
    rawLiquidityClue: CoinjoinAccount['rawLiquidityClue'];
}) =>
    ({
        type: COINJOIN.SESSION_TX_SIGNED,
        payload,
    } as const);

const clientSessionTxCandidate = (accountKey: string, roundId: string) =>
    ({
        type: COINJOIN.SESSION_TX_CANDIDATE,
        payload: {
            accountKey,
            roundId,
        },
    } as const);

const clientSessionTxBroadcasted = (accountKeys: string[], round: SerializedCoinjoinRound) =>
    ({
        type: COINJOIN.SESSION_TX_BROADCASTED,
        payload: {
            accountKeys,
            round,
        },
    } as const);

const clientSessionTxFailed = (accountKeys: string[], round: SerializedCoinjoinRound) =>
    ({
        type: COINJOIN.SESSION_TX_FAILED,
        payload: {
            accountKeys,
            round,
        },
    } as const);

const clientSessionPhase = (payload: CoinjoinClientEvents['session-phase']) =>
    ({
        type: COINJOIN.CLIENT_SESSION_PHASE,
        payload,
    } as const);

export const setDebugSettings = (payload: CoinjoinDebugSettings) =>
    ({
        type: COINJOIN.SET_DEBUG_SETTINGS,
        payload,
    } as const);

export const coinjoinSessionPause = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_PAUSE,
        payload: {
            accountKey,
        },
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof setDebugSettings>
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientOnStatusEvent>
    | ReturnType<typeof clientOnPrisonEvent>
    | ReturnType<typeof clientSessionRoundChanged>
    | ReturnType<typeof clientSessionCompleted>
    | ReturnType<typeof clientSessionOwnership>
    | ReturnType<typeof clientSessionPhase>
    | ReturnType<typeof clientSessionTxSigned>
    | ReturnType<typeof clientSessionTxCandidate>
    | ReturnType<typeof clientSessionTxBroadcasted>
    | ReturnType<typeof clientSessionTxFailed>
    | ReturnType<typeof clientSessionPhase>
    | ReturnType<typeof coinjoinSessionPause>;

// return only active instances
export const getCoinjoinClient = (symbol: Account['symbol']) =>
    CoinjoinService.getInstance(symbol)?.client;

export const unregisterByAccountKey =
    (accountKey: string) => (_dispatch: Dispatch, getState: GetState) => {
        const { accounts } = getState().wallet;
        const realAccount = accounts.find(a => a.key === accountKey);
        const client = realAccount && getCoinjoinClient(realAccount.symbol);
        client?.unregisterAccount(accountKey);
    };

export const endCoinjoinSession = (accountKey: string) => (dispatch: Dispatch) => {
    dispatch(clientSessionCompleted(accountKey));
    dispatch(unregisterByAccountKey(accountKey));
};

/**
 * Show "do not disconnect" screen on Trezor.
 * Multiple possible setups:
 * - 1 account on 1 device
 * - N accounts on 1 devices (like two passphrases)
 * - N accounts on X devices (like two physical device)
 */
export const setBusyScreen =
    (accountKeys: string[], expiry?: number) => (_dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { accounts },
        } = getState();

        // collect unique deviceStates from accounts (passphrase)
        const uniqueDeviceStates = accountKeys.flatMap(key => {
            const account = accounts.find(a => a.key === key);
            return account?.deviceState || [];
        });

        // collect unique physical devices (by device.id)
        const uniquePhysicalDevices = uniqueDeviceStates.reduce((result, state) => {
            const device = devices.find(d => d.connected && d.state === state);
            if (device && !result.find(d => d.id === device.id)) {
                return result.concat(device);
            }
            return result;
        }, [] as typeof devices);

        // async actions on each physical device in sequence
        return promiseAllSequence(
            uniquePhysicalDevices.map(device => () => {
                if (!expiry && !device.features?.busy) {
                    // skip unnecessary call if device is not in busy state
                    return Promise.resolve();
                }

                return TrezorConnect.setBusy({
                    device: {
                        path: device?.path,
                    },
                    override: true, // override current call (override SUITE.LOCK)
                    keepSession: !!expiry, // do not release device session, keep it for signTransaction
                    expiry_ms: expiry,
                });
            }),
        );
    };

export const hasCriticalPhaseModal = () => (_: Dispatch, getState: GetState) => {
    const { modal } = getState();
    return 'payload' in modal && modal.payload.type === 'critical-coinjoin-phase';
};

export const closeCriticalPhaseModal = () => (dispatch: Dispatch) => {
    if (dispatch(hasCriticalPhaseModal())) {
        dispatch(closeModal());
    }
};

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const pauseCoinjoinSession =
    (accountKey: string) => (dispatch: Dispatch, getState: GetState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }
        // get @trezor/coinjoin client if available
        const client = getCoinjoinClient(account.symbol);

        // unregister account in @trezor/coinjoin
        client?.unregisterAccount(accountKey);

        // dispatch data to reducer
        dispatch(coinjoinSessionPause(accountKey));
    };

// called from coinjoin account UI or exceptions like device disconnection, forget wallet/account etc.
export const stopCoinjoinSession =
    (accountKey: string) => async (dispatch: Dispatch, getState: GetState) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            return;
        }

        // get @trezor/coinjoin client if available
        const client = getCoinjoinClient(account.symbol);
        if (!client) {
            return;
        }

        const { device } = getState().suite;

        const result = await TrezorConnect.cancelCoinjoinAuthorization({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });

        if (!result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin session not stopped: ${result.payload.error}`,
                }),
            );

            return;
        }

        // unregister account in @trezor/coinjoin
        client.unregisterAccount(account.key);

        // dispatch data to reducer
        dispatch({
            type: COINJOIN.ACCOUNT_UNREGISTER,
            payload: {
                accountKey,
            },
        });
    };

export const onCoinjoinRoundChanged =
    ({ round }: CoinjoinRoundEvent) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const coinjoinAccounts = selectCoinjoinAccounts(state);
        const roundsDurationInHours = selectRoundsDurationInHours(state);
        // collect all account.keys from the round including failed one
        const accountKeys = round.inputs
            .concat(round.failed)
            .map(input => input.accountKey)
            .filter(arrayDistinct);

        const currentTimestamp = Date.now();

        const coinjoinAccountsWithSession = accountKeys.flatMap(
            accountKey => coinjoinAccounts.find(r => r.key === accountKey && r.session) || [],
        );

        let phaseChanged = false;
        coinjoinAccountsWithSession.forEach(account => {
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
                roundsLeft: selectRoundsLeftByAccountKey(state, account.key),
                roundsNeeded: selectRoundsNeededByAccountKey(state, account.key),
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
                    ({ session }) => session?.signedRounds?.length === session?.maxRounds,
                );
                if (accountsReachingMaxRounds.length) {
                    dispatch(openModal({ type: 'more-rounds-needed' }));
                    accountsReachingMaxRounds.forEach(({ key }) => {
                        dispatch(endCoinjoinSession(key));
                    });
                }

                const accountsWithAutostop = coinjoinAccountsWithSession.filter(
                    ({ key, session }) =>
                        !accountsReachingMaxRounds.find(accout => accout.key === key) &&
                        session?.isAutoStopEnabled,
                );

                accountsWithAutostop.forEach(({ key }) => {
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
                        relatedAccountKey: coinjoinAccountsWithSession[0].key, // since all accounts share the round, any key can be used,
                    }),
                );
            }
        }
    };

// populate errors for failed subset of requested inputs
const coinjoinResponseError = (utxos: CoinjoinRequestEvent['inputs'], error: string) =>
    utxos.map(u => ({ outpoint: u.outpoint, error }));

export const getOwnershipProof =
    (request: Extract<CoinjoinRequestEvent, { type: 'ownership' }>) =>
    async (_dispatch: Dispatch, getState: GetState) => {
        const {
            suite: { locks },
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

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
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key];
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

            const device = devices.find(d => d.state === realAccount.deviceState);
            if (!device?.connected) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device disconnected'));
                return [];
            }

            if (locks.includes(SUITE.LOCK_TYPE.DEVICE)) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device locked'));
                return [];
            }

            // TODO: double check if requested utxo exists in account?

            const bundle = groupUtxosByAccount[key].map(utxo => ({
                path: utxo.path,
                coin: realAccount.symbol,
                commitmentData: request.commitmentData,
                userConfirmation: true,
                preauthorized: true,
            }));
            return { key, device, bundle, utxos };
        });

        // process all bundles in sequence one device by one, fill the response object
        await promiseAllSequence(
            groupParamsByDevice.map(({ device, bundle, utxos }) => async () => {
                const proof = await TrezorConnect.getOwnershipProof({
                    device,
                    bundle,
                });
                if (proof.success) {
                    proof.payload.forEach((p, i) => {
                        if (!utxos[i]) return; // double check if data from Trezor corresponds with request
                        response.inputs.push({
                            outpoint: utxos[i].outpoint,
                            ownershipProof: p.ownership_proof,
                        });
                    });
                    return;
                }
                utxos.forEach(u => {
                    response.inputs.push({ outpoint: u.outpoint, error: proof.payload.error });
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
        (options.symbol
            ? [CoinjoinService.getInstance(options.symbol)]
            : CoinjoinService.getInstances()
        ).forEach(instance => {
            instance?.client.emit('log', { level: 'error', payload: reason });
        });
    };

export const signCoinjoinTx =
    (request: Extract<CoinjoinRequestEvent, { type: 'signature' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

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
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key && r.session);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key];
            if (!coinjoinAccount || !realAccount) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account not found'));
                return [];
            }

            const { session, rawLiquidityClue } = coinjoinAccount;
            if (!session || session.signedRounds.length >= session.maxRounds) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account without session'));
                return [];
            }

            const device = devices.find(d => d.state === realAccount.deviceState);
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
                            device,
                            useEmptyPassphrase: device?.useEmptyPassphrase,
                            // @ts-expect-error TODO: tx.inputs/outputs path is a string
                            inputs: tx.inputs,
                            // @ts-expect-error TODO: tx.inputs/outputs path is a string
                            outputs: tx.outputs,
                            coinjoinRequest: tx.coinjoinRequest,
                            coin: network,
                            preauthorized: true,
                            serialize: false,
                            unlockPath,
                            override: true, // override current call (override SUITE.LOCK)
                        });

                        if (signTx.success) {
                            let utxoIndex = 0;
                            tx.inputs.forEach((input, index) => {
                                if (input.script_type !== 'EXTERNAL') {
                                    response.inputs.push({
                                        outpoint: utxos[utxoIndex].outpoint,
                                        signature: signTx.payload.signatures[index],
                                        index,
                                    });
                                    utxoIndex++;
                                }
                            });

                            // create tx candidate
                            dispatch(clientSessionTxCandidate(key, roundId));

                            return;
                        }

                        utxos.forEach(u => {
                            response.inputs.push({
                                outpoint: u.outpoint,
                                error: signTx.payload.error,
                            });
                        });

                        dispatch(
                            notificationsActions.addToast({
                                type: 'error',
                                error: `Coinjoin signTransaction: ${signTx.payload.error}`,
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

export const initCoinjoinService =
    (symbol: Account['symbol']) => async (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const { clients, debug, accounts } = state.wallet.coinjoin;
        const knownClient = clients[symbol];
        if (knownClient?.status === 'loading') return;

        // find already running instance of @trezor/coinjoin client
        const knownService = CoinjoinService.getInstance(symbol);
        if (knownService && knownClient?.status === 'loaded') {
            return knownService;
        }

        const environment =
            debug?.coinjoinServerEnvironment && debug?.coinjoinServerEnvironment[symbol];

        // or start new instance
        dispatch(clientEnable(symbol));

        // restore CoinjoinPrison initialState
        const prison = accounts
            .filter(account => account.symbol === symbol && account.prison)
            .flatMap(account => {
                const realAccount = selectAccountByKey(state, account.key);
                if (!realAccount) return [];

                const utxos = realAccount.utxo!.map(getUtxoOutpoint);
                const usedChange = realAccount
                    .addresses!.change.filter(a => a.transfers > 0)
                    .map(a => a.address);

                return Object.keys(account.prison!).flatMap(id => {
                    const inmate = account.prison![id];
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
            const service = await CoinjoinService.createInstance({
                network: symbol,
                prison,
                environment,
            });
            const { client } = service;
            const status = await client.enable();
            if (!status) {
                throw new Error('status is missing');
            }
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
            dispatch(clientEnableSuccess(symbol, status));
            return service;
        } catch (error) {
            CoinjoinService.removeInstance(symbol);
            dispatch(clientEnableFailed(symbol));
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin client not enabled: ${error.message}`,
                }),
            );
        }
    };
