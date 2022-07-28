import TrezorConnect from '@trezor/connect';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import { add as addTransaction } from './transactionActions';
import {
    create as createAccount,
    update as updateAccountInfo,
    updateAccount,
} from './accountActions';
import { CoinjoinBackendService } from '@suite/services/coinjoin/coinjoinBackend';
import type { Dispatch, GetState } from '@suite-types';
import type { Account, Network } from '@wallet-types';

export type CoinjoinAccountAction = {
    type: typeof COINJOIN.ACCOUNT_CREATE;
    payload: Account;
};

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        if (account.backendType !== 'coinjoin') return;

        const lastKnownState = {
            time: Date.now(),
            blockHash: account.lastKnownState?.blockHash || '',
            progress: 0,
        };

        try {
            const api = CoinjoinBackendService.getInstance(account.symbol);
            const accountInfo = await api.getAccountInfo({
                descriptor: account.descriptor,
                lastKnownState: {
                    balance: account.balance,
                    blockHash: lastKnownState.blockHash,
                },
                onProgress: (progressState: any) => {
                    dispatch(
                        updateAccount({
                            ...account,
                            lastKnownState: {
                                ...progressState,
                                time: Date.now(),
                            },
                        }),
                    );
                },
                symbol: account.symbol,
            });

            if (accountInfo) {
                // get fresh info from reducer
                const updatedAccount = getState().wallet.accounts.find(a => a.key === account.key);
                if (updatedAccount && updatedAccount.lastKnownState) {
                    // finalize
                    dispatch(
                        updateAccountInfo(
                            {
                                ...updatedAccount,
                                lastKnownState: {
                                    time: Date.now(),
                                    blockHash: updatedAccount.lastKnownState.blockHash,
                                },
                            },
                            accountInfo,
                        ),
                    );
                    // add account transactions
                    if (accountInfo.history.transactions) {
                        dispatch(addTransaction(accountInfo.history.transactions, account));
                    }
                }
            } else {
                // TODO: no accountInfo
            }
        } catch (error) {
            // TODO
            console.warn('fetchAndUpdateAccount', error);
        }
    };

export const createCoinjoinAccount =
    (network: Network) => async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') return;
        const { device } = getState().suite;

        // TODO: Disable safety_checks until Trezor FW will implement slip-0025
        // const safety =
        //     device?.features?.safety_checks !== 'PromptTemporarily'
        //         ? 'PromptTemporarily'
        //         : undefined;
        const experimentalFeatures = await TrezorConnect.applySettings({
            device,
            experimental_features: true,
            // safety_checks: safety,
        });
        if (!experimentalFeatures.success) {
            dispatch(addToast({ type: 'error', error: 'Experimental features not enabled' }));
            return;
        }

        // temporary hardcoded until Trezor FW will implement slip-0025
        const PATH = `m/86'/1'/25'`; // `m/10025'/1'/0'`  network.bip43Path

        // get coinjoin account xpub
        const publicKey = await TrezorConnect.getPublicKey({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: PATH,
            coin: network.symbol,
        });
        if (!publicKey.success) {
            dispatch(addToast({ type: 'error', error: 'Public key not given' }));
            return;
        }

        // create empty account
        const account = dispatch(
            createAccount(
                device!.state!,
                {
                    index: 0,
                    path: PATH,
                    accountType: network.accountType,
                    networkType: network.networkType,
                    backendType: 'coinjoin',
                    coin: network.symbol,
                    derivationType: 0,
                    lastKnownState: {
                        time: 0,
                        blockHash: '',
                        progress: 0,
                    },
                },
                {
                    addresses: { change: [], used: [], unused: [] },
                    availableBalance: '0',
                    balance: '0',
                    descriptor: publicKey.payload.xpubSegwit || publicKey.payload.xpub,
                    empty: true,
                    history: { total: 0, unconfirmed: 0 },
                    legacyXpub: publicKey.payload.xpub,
                    page: { index: 1, size: 25, total: 1 },
                    utxo: [],
                },
            ),
        );
        dispatch({
            type: COINJOIN.ACCOUNT_CREATE,
            payload: account.payload,
        });

        // switch to account
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol: network.symbol,
                    accountType: network.accountType,
                    accountIndex: 0,
                },
            }),
        );

        // start discovery
        dispatch(fetchAndUpdateAccount(account.payload));
    };
