import { useEffect } from 'react';

import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

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
