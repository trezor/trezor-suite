import { Middleware } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { blockchainActions, reconnectBlockchainThunk } from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';
import { AppState, Dispatch } from 'src/types/suite';

const cleanupCustomRpcBackends = (
    blockchain: AppState['wallet']['blockchain'],
    dispatch: Dispatch,
) => {
    const networksToReset = (Object.keys(blockchain) as NetworkSymbol[]).filter(
        symbol => blockchain[symbol]?.backends?.selected === 'evm-rpc',
    );

    networksToReset.forEach(symbol => {
        dispatch(
            blockchainActions.setBackend({
                symbol,
                type: 'default',
            }),
        );

        dispatch(reconnectBlockchainThunk({ symbol }));
    });
};

const backendMiddleware: Middleware<{}, AppState> =
    ({ dispatch, getState }) =>
    next =>
    action => {
        const prevState = getState();
        const result = next(action);

        if (action.type === SUITE.SET_DEBUG_MODE) {
            const nextState = getState();

            const prevDebugMode = prevState.suite.settings.debug.showDebugMenu;
            const nextDebugMode = nextState.suite.settings.debug.showDebugMenu;

            const { blockchain } = nextState.wallet;

            if (prevDebugMode && !nextDebugMode) {
                cleanupCustomRpcBackends(blockchain, dispatch);
            }
        }

        return result;
    };

export default backendMiddleware;
