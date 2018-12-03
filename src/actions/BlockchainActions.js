/* @flow */

import * as BLOCKCHAIN from 'actions/constants/blockchain';
import * as EthereumBlockchainActions from 'actions/ethereum/BlockchainActions';
import * as RippleBlockchainActions from 'actions/ripple/BlockchainActions';

import type {
    Dispatch,
    GetState,
    PromiseAction,
} from 'flowtype';
import type { BlockchainBlock, BlockchainNotification, BlockchainError } from 'trezor-connect';


export type BlockchainAction = {
    type: typeof BLOCKCHAIN.READY,
} | {
    type: typeof BLOCKCHAIN.UPDATE_FEE,
    fee: string,
}

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks
export const init = (): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    if (getState().discovery.length > 0) {
        // get unique networks
        const networks: Array<string> = [];
        getState().discovery.forEach((discovery) => {
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

export const subscribe = (networkName: string): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === networkName);
    if (!network) return;

    if (network.type === 'ethereum') {
        await dispatch(EthereumBlockchainActions.subscribe(networkName));
    } else if (network.type === 'ripple') {
        await dispatch(RippleBlockchainActions.subscribe(networkName));
    }
};

export const onBlockMined = (payload: $ElementType<BlockchainBlock, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    if (getState().router.location.state.network !== shortcut) return;

    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    if (network.type === 'ethereum') {
        await dispatch(EthereumBlockchainActions.onBlockMined(shortcut));
    } else if (network.type === 'ripple') {
        await dispatch(RippleBlockchainActions.onBlockMined(shortcut));
    }
};

export const onNotification = (payload: $ElementType<BlockchainNotification, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    if (network.type === 'ethereum') {
        await dispatch(EthereumBlockchainActions.onNotification());
    } else if (network.type === 'ripple') {
        await dispatch(RippleBlockchainActions.onNotification(payload));
    }
};

// Handle BLOCKCHAIN.ERROR event from TrezorConnect
// disconnect and remove Web3 webscocket instance if exists
export const onError = (payload: $ElementType<BlockchainError, 'payload'>): PromiseAction<void> => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const shortcut = payload.coin.shortcut.toLowerCase();
    const { config } = getState().localStorage;
    const network = config.networks.find(c => c.shortcut === shortcut);
    if (!network) return;

    if (network.type === 'ethereum') {
        await dispatch(EthereumBlockchainActions.onError(shortcut));
    } else if (network.type === 'ripple') {
        // await dispatch(RippleBlockchainActions.onError(shortcut));
    }
};