import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { CoinjoinStatusEvent, CoinjoinRoundEvent, SerializedCoinjoinRound } from '@trezor/coinjoin';
import { arrayDistinct } from '@trezor/utils';
import * as COINJOIN from './constants/coinjoinConstants';
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

export type CoinjoinClientAction =
    | ReturnType<typeof clientEnable>
    | ReturnType<typeof clientDisable>
    | ReturnType<typeof clientEnableSuccess>
    | ReturnType<typeof clientEnableFailed>
    | ReturnType<typeof clientOnStatusEvent>
    | ReturnType<typeof clientSessionRoundChanged>
    | ReturnType<typeof clientSessionCompleted>;

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
