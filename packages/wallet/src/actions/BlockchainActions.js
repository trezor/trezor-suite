/* @flow */

import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as DiscoveryActions from 'actions/DiscoveryActions';
import * as EthereumBlockchainActions from 'actions/ethereum/BlockchainActions';
import * as RippleBlockchainActions from 'actions/ripple/BlockchainActions';

import type { Dispatch, GetState, PromiseAction, BlockchainFeeLevel } from 'flowtype';
import type { BlockchainBlock, BlockchainNotification, BlockchainError } from 'trezor-connect';

export type BlockchainAction =
    | {
          type: typeof BLOCKCHAIN.READY,
      }
    | {
          type: typeof BLOCKCHAIN.UPDATE_FEE,
          shortcut: string,
          feeLevels: Array<BlockchainFeeLevel>,
      }
    | {
          type: typeof BLOCKCHAIN.START_SUBSCRIBE,
          shortcut: string,
      }
    | {
          type: typeof BLOCKCHAIN.FAIL_SUBSCRIBE,
          shortcut: string,
      };

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks
export const init = (): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    if (getState().discovery.length > 0) {
        // get unique networks
        const networks: Array<string> = [];
        getState().discovery.forEach(discovery => {
            if (networks.indexOf(discovery.network) < 0) {
                networks.push(discovery.network);
            }
        });

        // subscribe
        const results = networks.map(n => dispatch(subscribe(n)));
        // wait for all subscriptions
        await Promise.all(results);
    }

    // continue wallet initialization
    dispatch({
        type: BLOCKCHAIN.READY,
    });
};

export const subscribe = (networkName: string): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === networkName);
    if (!network) return;

    dispatch({
        type: BLOCKCHAIN.START_SUBSCRIBE,
        shortcut: network.shortcut,
    });

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.subscribe(networkName));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.subscribe(networkName));
            break;
        default:
            break;
    }
};

export const onBlockMined = (
    payload: $ElementType<BlockchainBlock, 'payload'>
): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { block } = payload;
    if (getState().router.location.state.network !== shortcut) return;

    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.onBlockMined(shortcut));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.onBlockMined(shortcut, block));
            break;
        default:
            break;
    }
};

export const onNotification = (
    payload: $ElementType<BlockchainNotification, 'payload'>
): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    switch (network.type) {
        case 'ethereum':
            // this is not working until blockchain-link will start support blockbook backends
            await dispatch(EthereumBlockchainActions.onNotification(payload));
            break;
        case 'ripple':
            await dispatch(RippleBlockchainActions.onNotification(payload));
            break;
        default:
            break;
    }
};

// Handle BLOCKCHAIN.ERROR event from TrezorConnect
// disconnect and remove Web3 websocket instance if exists
export const onError = (
    payload: $ElementType<BlockchainError, 'payload'>
): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    dispatch(autoReconnect(shortcut));

    switch (network.type) {
        case 'ethereum':
            await dispatch(EthereumBlockchainActions.onError(shortcut));
            break;
        case 'ripple':
            // this error is handled in BlockchainReducer
            // await dispatch(RippleBlockchainActions.onBlockMined(shortcut));
            break;
        default:
            break;
    }
};

const autoReconnect = (shortcut: string): PromiseAction<void> => async (
    dispatch: Dispatch,
    getState: GetState
): Promise<void> => {
    const MAX_ATTEMPTS = 4;
    let blockchain = getState().blockchain.find(b => b.shortcut === shortcut);
    // try to automatically reconnect and wait after each attemp (5s * #attempt) untill max number of attemps is reached
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const waitTime = 5000 * (i + 1); /// 5s * #attempt
        if (!blockchain || blockchain.connected) {
            break;
        }

        blockchain = getState().blockchain.find(b => b.shortcut === shortcut);

        // reconnect with 7s timeout
        // eslint-disable-next-line no-await-in-loop
        await dispatch(DiscoveryActions.reconnect(shortcut, 7000));

        // wait before next try
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
};
