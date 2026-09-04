import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type BlockchainRootState,
    reconnectBlockchainThunk,
    selectBlockchainBackendType,
} from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

// No other networks need managing at the moment.
const symbol: NetworkSymbol = asNetworkSymbol('btc');

export const useBlockchainConnectionManager = () => {
    const dispatch = useDispatch();

    const blockchainBackendType = useSelector((state: BlockchainRootState) =>
        selectBlockchainBackendType(state, symbol),
    );

    useEffect(() => {
        if (blockchainBackendType === 'electrum') {
            // ElectrumClient tries to keep its server connection alive, which causes issues when
            // the mobile app is moved to the background. Since the app is eventually suspended and
            // the connection closed, the app later crashes when it tries to use an already closed
            // connection. So we need to manage the connection based on the app state.
            const subscription = AppState.addEventListener('change', nextAppState => {
                if (nextAppState === 'background') {
                    TrezorConnect.blockchainDisconnect({ coin: asCoinSymbol(symbol) });
                } else if (nextAppState === 'active') {
                    dispatch(reconnectBlockchainThunk({ symbol }));
                }
            });

            return () => {
                subscription.remove();
            };
        }
    }, [blockchainBackendType, dispatch]);
};
