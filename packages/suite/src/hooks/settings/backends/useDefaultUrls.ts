import { useState, useEffect } from 'react';
import TrezorConnect, { BlockchainLink } from '@trezor/connect';
import type { Network } from 'src/types/wallet';

export const useDefaultUrls = (coin: Network['symbol']): string[] => {
    const [link, setLink] = useState<BlockchainLink>();
    useEffect(() => {
        TrezorConnect.getCoinInfo({ coin }).then(result => {
            if (result.success) {
                setLink(result.payload.blockchainLink);
            }
        });
    }, [coin]);
    return link?.url ?? [];
};
