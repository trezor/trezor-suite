import { useEffect } from 'react';

import { type Account } from '@suite-common/wallet-types';
import TrezorConnect, { asCoinSymbol } from '@trezor/connect';

export const useSubscribeForSolanaBlockUpdates = (account: Account | null) => {
    useEffect(() => {
        // Subscribe to blocks for Solana, since they are not fetched globally
        // this is needed for correct Solana fee estimation
        if (account?.networkType === 'solana') {
            TrezorConnect.blockchainSubscribe({
                coin: asCoinSymbol(account.symbol),
                blocks: true,
            });

            return () => {
                TrezorConnect.blockchainUnsubscribe({
                    coin: asCoinSymbol(account.symbol),
                    blocks: true,
                });
            };
        }
    }, [account]);
};
