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
import { prepareCoinjoinTransaction } from '@wallet-utils/coinjoinUtils';
import { addToast } from '../suite/notificationActions';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch, GetState } from '@suite-types';
import { Account, CoinjoinServerEnvironment, RoundPhase } from '@suite-common/wallet-types';

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

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientOnStatusEvent>
    | ReturnType<typeof clientSessionRoundChanged>
    | ReturnType<typeof clientSessionCompleted>
    | ReturnType<typeof clientSessionOwnership>
    | ReturnType<typeof clientSessionSignTransaction>;

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
            const device = devices.find(d => d.state === state);
            if (device && !result.find(d => d.id === device.id)) {
                return result.concat(device);
            }
            return result;
        }, [] as typeof devices);

        // TODO: check if device is connected, unlocked, and features.busy
        // async actions on each physical device in sequence
        return uniquePhysicalDevices.reduce(
            (p, device) =>
                p.then(() => {
                    TrezorConnect.setBusy({
                        device: {
                            path: device?.path,
                        },
                        expiry_ms: expiry,
                    });
                }),
            Promise.resolve(),
        );
    };

export const onCoinjoinRoundChanged =
    ({ round }: CoinjoinRoundEvent) =>
    (dispatch: Dispatch, getState: GetState) => {
        const { accounts } = getState().wallet.coinjoin;
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
                // TODO: open critical phase modal
                dispatch(setBusyScreen(accountKeys, round.roundDeadline - Date.now()));
            }

            if (round.phase === RoundPhase.Ended) {
                // TODO: close critical phase modal
                dispatch(setBusyScreen(accountKeys));
            }
        }
    };

const getOwnershipProof =
    (_network: Account['symbol'], request: Extract<CoinjoinRequestEvent, { type: 'ownership' }>) =>
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
        const groupUtxosByAccount = request.inputs.reduce((result, utxo) => {
            if (!result[utxo.accountKey]) {
                result[utxo.accountKey] = [];
            }
            result[utxo.accountKey].push(utxo);
            return result;
        }, {} as Record<string, typeof request.inputs>);

        // prepare array of parameters for TrezorConnect, grouped by TrezorDevice
        const groupParamsByDevice = Object.keys(groupUtxosByAccount).flatMap(key => {
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key);
            const realAccount = accounts.find(a => a.key === key);
            const utxos = groupUtxosByAccount[key];
            if (!coinjoinAccount || !realAccount) {
                response.inputs.push(
                    ...utxos.map(u => ({ outpoint: u.outpoint, error: 'Account not found' })),
                );
                return []; // TODO not registered?
            }
            const device = devices.find(d => d.state === realAccount.deviceState);
            if (!device) {
                response.inputs.push(
                    ...utxos.map(u => ({ outpoint: u.outpoint, error: 'Device not found' })),
                );
                return []; // TODO disconnected
            }

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

const signCoinjoinTx =
    (network: Account['symbol'], request: Extract<CoinjoinRequestEvent, { type: 'witness' }>) =>
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

        console.warn('signCoinjoinTx');

        // group utxos by account
        const groupUtxosByAccount = request.inputs.reduce((result, utxo) => {
            if (!result[utxo.accountKey]) {
                result[utxo.accountKey] = [];
            }
            result[utxo.accountKey].push(utxo);
            return result;
        }, {} as Record<string, typeof request.inputs>);

        const groupParamsByDevice = Object.keys(groupUtxosByAccount).flatMap(key => {
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key && r.session);
            const realAccount = accounts.find(a => a.key === key);
            if (!coinjoinAccount || !realAccount) return []; // TODO not registered?
            const device = devices.find(d => d.state === realAccount.deviceState);

            const tx = prepareCoinjoinTransaction(realAccount, request.transaction);
            return {
                key,
                roundId: request.roundId,
                utxos: groupUtxosByAccount[key],
                device,
                tx,
                unlockPath: realAccount.unlockPath,
            };
        });

        const signTx = async ({
            device,
            tx,
            utxos,
            roundId,
            key,
            unlockPath,
        }: typeof groupParamsByDevice[number]) => {
            console.warn('SIGN PARAMS', tx);

            const signTx = await TrezorConnect.signTransaction({
                device,
                useEmptyPassphrase: device?.useEmptyPassphrase,
                // @ts-expect-error TODO: tx.inputs/outputs path is a string
                inputs: tx.inputs,
                // @ts-expect-error TODO: tx.inputs/outputs path is a string
                outputs: tx.outputs,
                paymentRequests: [tx.paymentRequest],
                coin: network,
                preauthorized: true,
                unlockPath,
            });

            if (signTx.success) {
                console.warn('WITTNESSES!', signTx.payload.witnesses);
                let utxoIndex = 0;
                tx.inputs.forEach((input, index) => {
                    if (input.script_type !== 'EXTERNAL') {
                        response.inputs.push({
                            outpoint: utxos[utxoIndex].outpoint,
                            // @ts-expect-error TODO: witness undefined
                            witness: signTx.payload.witnesses![index],
                            witnessIndex: index,
                        });
                        utxoIndex++;
                    }
                });

                dispatch(clientSessionSignTransaction(key, roundId));
                return;
            }

            utxos.forEach(u => {
                response.inputs.push({ outpoint: u.outpoint, error: signTx.payload.error });
            });

            dispatch(
                addToast({
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

        // finally walk thru all requested utxos and find not resolved
        request.inputs.forEach(utxo => {
            if (!response.inputs.find(u => u.outpoint === utxo.outpoint)) {
                response.inputs.push({ outpoint: utxo.outpoint, error: 'Request unresolved' });
            }
        });

        return response;
    };

const onCoinjoinClientRequest =
    (network: Account['symbol'], data: CoinjoinRequestEvent[]) => (dispatch: Dispatch) => {
        console.log('Coinjoin on request', network, data);
        return Promise.all(
            data.map(request => {
                if (request.type === 'ownership') {
                    return dispatch(getOwnershipProof(network, request));
                }
                if (request.type === 'witness') {
                    return dispatch(signCoinjoinTx(network, request));
                }
                return request;
            }),
        );
    };

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
                const response = await dispatch(onCoinjoinClientRequest(symbol, data));
                client.resolveRequest(response);
            });
            dispatch(clientEnableSuccess(symbol, status));
            return client;
        } catch (error) {
            CoinjoinClientService.removeInstance(symbol);
            dispatch(clientEnableFailed(symbol));
            dispatch(
                addToast({
                    type: 'error',
                    error: `Coinjoin client not enabled: ${error.message}`,
                }),
            );
        }
    };

// return only active instances
export const getCoinjoinClient = (symbol: Account['symbol']) =>
    CoinjoinClientService.getInstance(symbol);

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
