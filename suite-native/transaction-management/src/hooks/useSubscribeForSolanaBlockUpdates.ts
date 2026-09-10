import { useEffect } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import TrezorConnect, { asCoinSymbol } from '@trezor/connect';

type UseSubscribeForSolanaBlockUpdatesParams = {
    symbol: NetworkSymbol | null;
    networkType: NetworkType | null;
};

export const useSubscribeForSolanaBlockUpdates = ({
    symbol,
    networkType,
}: UseSubscribeForSolanaBlockUpdatesParams) => {
    useEffect(() => {
        // Subscribe to blocks for Solana, since they are not fetched globally.
        // This is needed for correct Solana fee estimation.
        if (networkType === 'solana' && symbol) {
            TrezorConnect.blockchainSubscribe({
                coin: asCoinSymbol(symbol),
                blocks: true,
            });

            return () => {
                TrezorConnect.blockchainUnsubscribe({
                    coin: asCoinSymbol(symbol),
                    blocks: true,
                });
            };
        }
    }, [networkType, symbol]);
};
