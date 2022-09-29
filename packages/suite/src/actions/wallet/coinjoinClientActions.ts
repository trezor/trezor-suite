import TrezorConnect from '@trezor/connect';
import { CoinjoinStatus, CoinjoinClientEvent, RequestEvent, ActiveRound } from '@trezor/coinjoin';
import * as COINJOIN from './constants/coinjoinConstants';
import { addToast } from '../suite/notificationActions';
import { CoinjoinClientService } from '@suite/services/coinjoin/coinjoinClient';
import { Dispatch, GetState } from '@suite-types';
import { Account } from '@suite-common/wallet-types';

const clientEnable = (symbol: Account['symbol']) =>
    ({ type: COINJOIN.CLIENT_ENABLE, symbol } as const);

const clientEnableSuccess = (symbol: Account['symbol'], status: CoinjoinStatus) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_SUCCESS,
        symbol,
        status,
    } as const);

const clientEnableFailed = (symbol: Account['symbol']) =>
    ({
        type: COINJOIN.CLIENT_ENABLE_FAILED,
        symbol,
    } as const);

const clientActiveRoundChanged = (accountKey: string, round: ActiveRound) =>
    ({
        type: COINJOIN.ROUND_PHASE_CHANGED,
        accountKey,
        round,
    } as const);

const clientActiveRoundOwnership = (accountKey: string, roundId: string) =>
    ({
        type: COINJOIN.ROUND_TX_SIGNED,
        accountKey,
        roundId,
    } as const);

const clientActiveRoundSign = (accountKey: string, roundId: string) =>
    ({
        type: COINJOIN.ROUND_TX_SIGNED,
        accountKey,
        roundId,
    } as const);

const clientActiveRoundCompleted = (accountKey: string, round: ActiveRound) =>
    ({
        type: COINJOIN.ROUND_COMPLETED,
        accountKey,
        round,
    } as const);

const clientSessionCompleted = (accountKey: string) =>
    ({
        type: COINJOIN.SESSION_COMPLETED,
        accountKey,
    } as const);

const clientLog = (payload: string) =>
    ({
        type: COINJOIN.CLIENT_LOG,
        payload,
    } as const);

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientActiveRoundChanged>
    | ReturnType<typeof clientActiveRoundOwnership>
    | ReturnType<typeof clientActiveRoundSign>
    | ReturnType<typeof clientActiveRoundCompleted>
    | ReturnType<typeof clientSessionCompleted>
    | ReturnType<typeof clientLog>;

const doPreauthorized = (round: ActiveRound) => (_dispatch: Dispatch, getState: GetState) => {
    const {
        devices,
        wallet: { accounts },
    } = getState();
    const params = Object.keys(round.accounts).flatMap(key => {
        const realAccount = accounts.find(a => a.key === key);
        if (!realAccount) return []; // TODO not registered?
        const device = devices.find(d => d.state === realAccount.deviceState);
        return { device };
    });
    // async actions in sequence
    return params.reduce(
        (p, { device }) =>
            p.then(() => {
                TrezorConnect.setBusy({
                    device: {
                        path: device?.path,
                    },
                    expiry_ms: 10000,
                });
            }),
        Promise.resolve(),
    );
};

const onCoinjoinClientEvent =
    (_network: Account['symbol'], event: CoinjoinClientEvent) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (event.type === 'round-change') {
            const round = event.payload;
            const { accounts } = getState().wallet.coinjoin;
            const accountsInRound = Object.keys(round.accounts);

            const coinjoinAccounts = accountsInRound.flatMap(
                accountKey => accounts.find(r => r.key === accountKey && r.session) || [],
            );

            // const client = coinjoinClients.find(c => c.settings.network === network);
            coinjoinAccounts.forEach(account => {
                if (account.session?.phase !== round.phase) {
                    dispatch(clientActiveRoundChanged(account.key, round));

                    if (round.phase === 1) {
                        dispatch(doPreauthorized(round));
                    }

                    if (round.phase === 4) {
                        if (account.session?.signedRounds.length === account.session?.maxRounds) {
                            // const account = getState().wallet.accounts.find(a => a.key === accountKey);
                            // client.unregisterAccount(reg.accountKey);
                            dispatch(clientSessionCompleted(account.key));

                            dispatch(
                                addToast({
                                    type: 'coinjoin-complete',
                                }),
                            );
                            // const client = coinjoinClients.find(
                            //     c => c.settings.network === network,
                            // );
                            // client?.unregisterAccount(reg.accountKey);
                        } else if (round.coinjoinState.isFullySigned) {
                            dispatch(clientActiveRoundCompleted(account.key, round));

                            dispatch(
                                addToast({
                                    type: 'coinjoin-round-complete',
                                }),
                            );
                        }
                    }
                }
            });
        }
    };

const getOwnershipProof =
    (network: Account['symbol'], request: Extract<RequestEvent, { type: 'ownership' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

        console.warn('getOwnershipProof');

        const params = Object.keys(request.accounts).flatMap(key => {
            const registredAccount = coinjoin.accounts.find(r => r.key === key && r.session);
            const realAccount = accounts.find(a => a.key === key);
            if (!registredAccount || !realAccount) return []; // TODO not registered?
            const device = devices.find(d => d.state === realAccount.deviceState);
            const bundle = request.accounts[key].utxos.map(utxo => ({
                path: utxo.path,
                coin: network,
                commitmentData: request.commitmentData,
                userConfirmation: true,
                preauthorized: true,
            }));
            return { key, device, bundle };
        });

        if (params.length < 1) {
            Object.keys(request.accounts).forEach(key => {
                const { utxos } = request.accounts[key];
                request.accounts[key].utxos = utxos.map(utxo => ({
                    ...utxo,
                    error: 'no registered account to get proof', // TODO handle in lib
                }));
            });
        }

        // async actions in sequence
        await params.reduce(
            (p, { key, device, bundle }) =>
                p.then(async () => {
                    const proof = await TrezorConnect.getOwnershipProof({
                        device,
                        bundle,
                    });
                    const { utxos } = request.accounts[key];
                    if (proof.success) {
                        request.accounts[key].utxos = utxos.map((utxo, index) => ({
                            ...utxo,
                            ownershipProof: proof.payload[index].ownership_proof,
                        }));
                    } else {
                        request.accounts[key].utxos = utxos.map(utxo => ({
                            ...utxo,
                            error: 'no proof', // TODO handle in lib
                        }));
                        dispatch(
                            addToast({
                                type: 'error',
                                error: `Coinjoin sign getOwnershipProof: ${proof.payload.error}`,
                            }),
                        );
                    }
                }),
            Promise.resolve(),
        );

        return request;
    };

const signCoinjoinTx =
    (network: Account['symbol'], request: Extract<RequestEvent, { type: 'witness' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

        const { transaction } = request;

        console.warn('signCoinjoinTx');

        const params = Object.keys(request.accounts).flatMap(key => {
            const coinjoinAccount = coinjoin.accounts.find(r => r.key === key && r.session);
            const realAccount = accounts.find(a => a.key === key);
            if (!coinjoinAccount || !realAccount) return []; // TODO not registered?
            const device = devices.find(d => d.state === realAccount.deviceState);
            const inputScriptType =
                realAccount.accountType === 'normal' ? 'SPENDWITNESS' : 'SPENDTAPROOT';
            const outputScriptType =
                realAccount.accountType === 'normal' ? 'PAYTOWITNESS' : 'PAYTOTAPROOT';
            // construct protobuf transaction for each participating account
            const tx = {
                inputs: transaction.inputs.map(input => {
                    if (input.path) {
                        return {
                            script_type: inputScriptType,
                            address_n: input.path!,
                            prev_hash: input.hash,
                            prev_index: input.index,
                            amount: input.amount,
                        };
                    }

                    return {
                        address_n: undefined,
                        script_type: 'EXTERNAL' as const,
                        prev_hash: input.hash,
                        prev_index: input.index,
                        amount: input.amount,
                        script_pubkey: input.scriptPubKey,
                        ownership_proof: input.ownershipProof,
                        commitment_data: input.commitmentData,
                    };
                }),
                outputs: transaction.outputs.map(output => {
                    if (output.path) {
                        return {
                            address_n: output.path! as any,
                            amount: output.amount,
                            script_type: outputScriptType,
                            payment_req_index: 0,
                        };
                    }
                    return {
                        address: output.address,
                        amount: output.amount,
                        script_type: 'PAYTOADDRESS' as const,
                        payment_req_index: 0,
                    };
                }),
            };
            const paymentRequest = {
                ...transaction.paymentRequest,
                amount: tx.outputs.reduce(
                    (sum, output) =>
                        typeof output.address === 'string' ? sum + output.amount : sum,
                    0,
                ),
            };
            return {
                key,
                roundId: request.round,
                device,
                tx,
                paymentRequest,
                unlockPath: realAccount.unlockPath,
            };
        });

        if (params.length < 1) {
            Object.keys(request.accounts).forEach(key => {
                const { utxos } = request.accounts[key];
                request.accounts[key].utxos = utxos.map(utxo => ({
                    ...utxo,
                    error: 'no registered account to get witness', // TODO handle in lib
                }));
            });
        }

        // async actions in sequence
        await params.reduce(
            (p, { device, tx, paymentRequest, roundId, key, unlockPath }) =>
                p.then(async () => {
                    console.warn('SIGN PARAMS', tx);
                    // @ts-expect-error TODO: tx.inputs/outputs path is a string
                    const signTx = await TrezorConnect.signTransaction({
                        device,
                        useEmptyPassphrase: device?.useEmptyPassphrase,
                        paymentRequests: [paymentRequest],
                        coin: network,
                        preauthorized: true,
                        unlockPath,
                        ...tx,
                    });
                    const { utxos } = request.accounts[key];
                    if (signTx.success) {
                        console.warn('WITTNESSES!', signTx.payload.witnesses);
                        let utxoIndex = 0;
                        tx.inputs.forEach((input, index) => {
                            if (input.script_type !== 'EXTERNAL') {
                                request.accounts[key].utxos[utxoIndex].witness =
                                    signTx.payload.witnesses![index];
                                request.accounts[key].utxos[utxoIndex].witnessIndex = index;
                                utxoIndex++;
                            }
                        });
                        // request.accounts[key].utxos = utxos.map((utxo, index) => ({
                        //     ...utxo,
                        //     witness: signTx.payload.witnesses![index],
                        //     witnessIndex: index,
                        // }));

                        dispatch(clientActiveRoundSign(key, roundId));

                        // const pendingAccount = getPendingAccount(account, precomposedTx, 'txid');
                        // if (pendingAccount) {
                        //     // update account
                        //     dispatch(accountActions.updateAccount(pendingAccount));
                        //     if (account.networkType === 'cardano') {
                        //         // manually add fake pending tx as we don't have the data about mempool txs
                        //         dispatch(transactionActions.addFakePendingTx(precomposedTx, txid, pendingAccount));
                        //     }
                        // }
                    } else {
                        request.accounts[key].utxos = utxos.map(utxo => ({
                            ...utxo,
                            error: 'no witness', // TODO handle in lib
                        }));
                        dispatch(
                            addToast({
                                type: 'error',
                                error: `Coinjoin signTransaction: ${signTx.payload.error}`,
                            }),
                        );
                    }
                }),
            Promise.resolve(),
        );

        return request;
    };

const onCoinjoinClientRequest =
    (network: Account['symbol'], data: RequestEvent[]) => (dispatch: Dispatch) => {
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

// const handleActiveRoundChange = (network: Account['symbol'], request: Extract<RequestEvent, { type: 'witness' }>) => (dispatch: Dispatch) => {
//     console.log('Coinjoin on active round', event)
// }

// const handleStatusChange = (network: Account['symbol'], request: OnS) => (dispatch: Dispatch) => {
//     console.log('Coinjoin on active round', event)
// }

export const initCoinjoinClient = (symbol: Account['symbol']) => async (dispatch: Dispatch) => {
    // find already running instance of @trezor/coinjoin client
    const knownClient = CoinjoinClientService.getInstance(symbol);
    if (knownClient) {
        return knownClient;
    }

    // or start new instance
    dispatch(clientEnable(symbol));

    const client = await CoinjoinClientService.createInstance(symbol);
    try {
        const status = await client.enable();
        // handle status change
        client.on('status', event => console.log('Coinjoin on status', event));
        // handle active round change
        client.on('event', event => {
            dispatch(onCoinjoinClientEvent(symbol, event));
        });
        // handle requests (ownership proof, sign transaction)
        client.on('request', async data => {
            const response = await dispatch(onCoinjoinClientRequest(symbol, data));
            client.resolveRequest(response);
        });
        // handle log
        client.on('log', (...args: any[]) => {
            dispatch(clientLog(args.join(' ')));
        });
        dispatch(clientEnableSuccess(symbol, status as any)); // TODO
        return client;
    } catch (error) {
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
export const getCoinjoinClient = (symbol: Account['symbol']) => () =>
    CoinjoinClientService.getInstance(symbol);
