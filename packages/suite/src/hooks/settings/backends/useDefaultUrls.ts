import { useState, useEffect } from 'react';
import TrezorConnect, { BlockchainLink } from '@trezor/connect';
import type { Network } from 'src/types/wallet';

export const useDefaultUrls = (
    coin: Network['symbol'],
): { defaultUrls: string[]; isLoading: boolean } => {
    const [link, setLink] = useState<BlockchainLink>();
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setIsLoading(true);
        TrezorConnect.getCoinInfo({ coin }).then(result => {
            if (result.success) {
                setLink(result.payload.blockchainLink);
            }
            setIsLoading(false);
        });
    }, [coin]);
    return { defaultUrls: link?.url ?? [], isLoading };
};
