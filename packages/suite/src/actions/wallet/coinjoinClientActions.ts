import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    CoinjoinStatusEvent,
    CoinjoinRoundEvent,
    SerializedCoinjoinRound,
    CoinjoinRequestEvent,
    CoinjoinResponseEvent,
} from '@trezor/coinjoin';
import { arrayDistinct } from '@trezor/utils';
import * as COINJOIN from './constants/coinjoinConstants';
import { breakdownCoinjoinBalance, prepareCoinjoinTransaction } from '@wallet-utils/coinjoinUtils';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch, GetState } from '@suite-types';
import { Account, CoinjoinServerEnvironment, RoundPhase } from '@suite-common/wallet-types';
import { onCancel as closeModal, openModal } from '@suite-actions/modalActions';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { isZero } from '@suite-common/wallet-utils';

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

const clientSessionRoundChanged = (accountKey: string, round: SerializedCoinjoinRound) =>
    ({
        type: COINJOIN.SESSION_ROUND_CHANGED,
        payload: {
            accountKey,
            round,
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

const clientSessionSignTransaction = (accountKey: string, roundId: string) =>
    ({
        type: COINJOIN.SESSION_TX_SIGNED,
        payload: {
            accountKey,
            roundId,
        },
    } as const);

const clientLog = (symbol: Account['symbol'], message: string) =>
    ({
        type: COINJOIN.CLIENT_LOG,
        payload: {
            symbol,
            message,
        },
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientOnStatusEvent>
    | ReturnType<typeof clientSessionRoundChanged>
    | ReturnType<typeof clientSessionCompleted>
    | ReturnType<typeof clientSessionOwnership>
    | ReturnType<typeof clientSessionSignTransaction>
    | ReturnType<typeof clientLog>;

// return only active instances
export const getCoinjoinClient = (symbol: Account['symbol']) =>
    CoinjoinClientService.getInstance(symbol);

export const unregisterByAccountKey =
    (accountKey: string) => (_dispatch: Dispatch, getState: GetState) => {
        const { accounts } = getState().wallet;
        const realAccount = accounts.find(a => a.key === accountKey);
        const client = realAccount && getCoinjoinClient(realAccount.symbol);
        client?.unregisterAccount(accountKey);
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

        const setBusy = (device: typeof uniquePhysicalDevices[number]) => {
            if (!expiry && !device.features?.busy) {
                // skip unnecessary call if device is not in busy state
                return;
            }

            TrezorConnect.setBusy({
                device: {
                    path: device?.path,
                },
                keepSession: !!expiry, // do not release device session, keep it for signTransaction
                expiry_ms: expiry,
            });
        };

        // async actions on each physical device in sequence
        return uniquePhysicalDevices.reduce(
            (p, device) => p.then(() => setBusy(device)),
            Promise.resolve(),
        );
    };

export const onCoinjoinRoundChanged =
    ({ round }: CoinjoinRoundEvent) =>
    (dispatch: Dispatch, getState: GetState) => {
        const state = getState();
        const { accounts } = state.wallet.coinjoin;
        // collect all account.keys from the round including failed one
        const accountKeys = round.inputs
            .concat(round.failed)
            .map(input => input.accountKey)
            .filter(arrayDistinct);

        const coinjoinAccountsWithSession = accountKeys.flatMap(
            accountKey => accounts.find(r => r.key === accountKey && r.session) || [],
        );

        let phaseChanged = false;
        coinjoinAccountsWithSession.forEach(account => {
            if (account.session?.phase !== round.phase) {
                phaseChanged = true;
            }
            // notify reducers
            dispatch(clientSessionRoundChanged(account.key, round));
        });

        // round event is triggered multiple times. like at the beginning and at the end of round process
        // critical actions should be triggered only once
        if (phaseChanged) {
            if (round.phase === RoundPhase.ConnectionConfirmation) {
                dispatch(setBusyScreen(accountKeys, round.roundDeadline - Date.now()));

                dispatch(
                    openModal({
                        type: 'critical-coinjoin-phase',
                        relatedAccountKey: coinjoinAccountsWithSession[0].key, // since all accounts share the round, any key can be used,
                    }),
                );
            }

            if (round.phase === RoundPhase.Ended) {
                dispatch(setBusyScreen(accountKeys));
                dispatch(closeModal());

                const completedSessions = coinjoinAccountsWithSession.filter(
                    ({ session }) => session?.signedRounds?.length === session?.maxRounds,
                );

                if (completedSessions.length > 0) {
                    const moreRoundsNeeded = completedSessions.some(({ key, targetAnonymity }) => {
                        const account = selectAccountByKey(state, key);

                        const { notAnonymized } = breakdownCoinjoinBalance({
                            anonymitySet: account?.addresses?.anonymitySet,
                            targetAnonymity,
                            utxos: account?.utxo,
                        });

                        return !isZero(notAnonymized);
                    });

                    dispatch(
                        openModal(
                            moreRoundsNeeded
                                ? { type: 'more-rounds-needed' }
                                : {
                                      type: 'coinjoin-success',
                                      relatedAccountKey: completedSessions[0].key,
                                  },
                        ),
                    );
                    completedSessions.forEach(({ key }) => {
                        dispatch(clientSessionCompleted(key));
                        dispatch(unregisterByAccountKey(key));
                    });
                }
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
        const groupUtxosByAccount = request.inputs.reduce<Record<string, typeof request.inputs>>(
            (result, utxo) => {
                if (!result[utxo.accountKey]) {
                    result[utxo.accountKey] = [];
                }
                result[utxo.accountKey].push(utxo);
                return result;
            },
            {},
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
            if (!session || session.signedRounds.length >= session.maxRounds) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account without session'));
                return [];
            }
            const device = devices.find(d => d.state === realAccount.deviceState);
            if (!device) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device not found'));
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

        // process single TrezorDevice bundle, fill the response object
        const getOwnershipBundle = async ({
            device,
            bundle,
            utxos,
        }: typeof groupParamsByDevice[number]) => {
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
        };

        // process all bundles in sequence, one device by one
        await groupParamsByDevice.reduce(
            (promise, params) => promise.then(() => getOwnershipBundle(params)),
            Promise.resolve(),
        );

        // finally walk thru all requested utxos and find not resolved
        request.inputs.forEach(utxo => {
            if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
                response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
            }
        });

        return response;
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
        const groupUtxosByAccount = request.inputs.reduce<Record<string, typeof request.inputs>>(
            (result, utxo) => {
                if (!result[utxo.accountKey]) {
                    result[utxo.accountKey] = [];
                }
                result[utxo.accountKey].push(utxo);
                return result;
            },
            {},
        );

        const groupParamsByDevice = Object.keys(groupUtxosByAccount).flatMap(key => {
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key && r.session);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key];
            if (!coinjoinAccount || !realAccount) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account not found'));
                return [];
            }
            const { session } = coinjoinAccount;
            if (!session || session.signedRounds.length >= session.maxRounds) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Account without session'));
                return [];
            }
            const device = devices.find(d => d.state === realAccount.deviceState);
            if (!device) {
                response.inputs.push(...coinjoinResponseError(utxos, 'Device not found'));
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
            };
        });

        const signTx = async ({
            device,
            tx,
            utxos,
            roundId,
            key,
            network,
            unlockPath,
        }: typeof groupParamsByDevice[number]) => {
            // notify reducer before signing, failed signing are also counted in Trezor maxRound limit
            dispatch(clientSessionSignTransaction(key, roundId));

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
                return;
            }

            utxos.forEach(u => {
                response.inputs.push({ outpoint: u.outpoint, error: signTx.payload.error });
            });

            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin signTransaction: ${signTx.payload.error}`,
                }),
            );
        };

        // async actions in sequence
        await groupParamsByDevice.reduce(
            (promise, params) => promise.then(() => signTx(params)),
            Promise.resolve(),
        );

        // disable busy screen
        await dispatch(setBusyScreen(Object.keys(groupUtxosByAccount)));
        // and close 'critical-coinjoin-phase' modal
        dispatch(closeModal());

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

export const initCoinjoinClient =
    (symbol: Account['symbol'], environment?: CoinjoinServerEnvironment) =>
    async (dispatch: Dispatch) => {
        // find already running instance of @trezor/coinjoin client
        const knownClient = CoinjoinClientService.getInstance(symbol);
        if (knownClient) {
            return knownClient;
        }

        // or start new instance
        dispatch(clientEnable(symbol));

        const client = await CoinjoinClientService.createInstance(symbol, environment);
        try {
            const status = await client.enable();
            if (!status) {
                throw new Error('status is missing');
            }
            // handle status change
            client.on('status', status => dispatch(clientOnStatusEvent(symbol, status)));
            // handle active round change
            client.on('round', event => dispatch(onCoinjoinRoundChanged(event)));
            // handle requests (ownership proof, sign transaction)
            client.on('request', async data => {
                const response = await dispatch(onCoinjoinClientRequest(data));
                client.resolveRequest(response);
            });
            // handle log
            client.on('log', message => dispatch(clientLog(symbol, message)));
            dispatch(clientEnableSuccess(symbol, status));
            return client;
        } catch (error) {
            CoinjoinClientService.removeInstance(symbol);
            dispatch(clientEnableFailed(symbol));
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: `Coinjoin client not enabled: ${error.message}`,
                }),
            );
        }
    };

export const analyzeTransactions =
    (accountInfo: AccountInfo, symbol: Account['symbol']) => async () => {
        if (!accountInfo.utxo || !accountInfo.addresses) return accountInfo;

        const { utxo, history } = accountInfo;
        // Fallback with anonymity 1 on each utxo
        let anonymitySet = utxo.reduce((aSet, utxo) => {
            aSet[utxo.address] = 1;
            return aSet;
        }, {} as Record<string, number>);

        const client = getCoinjoinClient(symbol);
        try {
            const realAnonymitySet = await client?.analyzeTransactions(history.transactions || []);
            if (realAnonymitySet) {
                anonymitySet = realAnonymitySet;
            }
        } catch (error) {
            console.warn('analyzeTransactions error', error);
        }

        const accountInfoWithAnonymitySet = {
            ...accountInfo,
            addresses: {
                ...accountInfo.addresses,
                anonymitySet,
            },
        };

        return accountInfoWithAnonymitySet;
    };

export const getCoinjoinServerEnvironment =
    (symbol: Account['symbol']) => (_: Dispatch, getState: GetState) => {
        const { debug } = getState().suite.settings;
        if (symbol === 'regtest') {
            return debug.coinjoinRegtestServerEnvironment;
        }
    };
