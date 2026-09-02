import { useEffect } from 'react';

import { type Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

export const useSolanaSubscribeBlocks = (account: Account | undefined) => {
    useEffect(() => {
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
