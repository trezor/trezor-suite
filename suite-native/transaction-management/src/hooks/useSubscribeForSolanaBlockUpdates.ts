import { useEffect } from 'react';

import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

export const useSubscribeForSolanaBlockUpdates = (account: Account | null) => {
    useEffect(() => {
        // Subscribe to blocks for Solana, since they are not fetched globally
        // this is needed for correct Solana fee estimation
        if (account && account.networkType === 'solana') {
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
