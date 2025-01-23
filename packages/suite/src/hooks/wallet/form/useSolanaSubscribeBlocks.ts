import { useEffect } from 'react';

import TrezorConnect from '@trezor/connect';
import { Account } from '@suite-common/wallet-types';

export const useSolanaSubscribeBlocks = (account: Account) => {
    useEffect(() => {
        if (account.networkType === 'solana') {
            TrezorConnect.blockchainSubscribe({
                coin: account.symbol,
                blocks: true,
            });

            return () => {
                TrezorConnect.blockchainUnsubscribe({
                    coin: account.symbol,
                    blocks: true,
                });
            };
        }
    }, [account]);
};
