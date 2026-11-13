import { useEffect } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import { asCoinSymbol } from '@trezor/connect-common';

export const useSolanaSubscribeBlocks = (account: Account | undefined) => {
    useEffect(() => {
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
