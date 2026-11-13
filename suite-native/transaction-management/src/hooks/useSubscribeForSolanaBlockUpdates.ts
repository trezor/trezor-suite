import { useEffect } from 'react';

import type { Account } from '@suite-common/wallet-types';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asCoinSymbol } from '@trezor/connect';

export const useSubscribeForSolanaBlockUpdates = (account: Account | null) => {
    useEffect(() => {
        // Subscribe to blocks for Solana, since they are not fetched globally
        // this is needed for correct Solana fee estimation
        if (account?.networkType === 'solana') {
            TrezorBlockchain.subscribe({
                coin: asCoinSymbol(account.symbol),
                blocks: true,
            });

            return () => {
                TrezorBlockchain.unsubscribe({
                    coin: asCoinSymbol(account.symbol),
                    blocks: true,
                });
            };
        }
    }, [account]);
};
