import { useEffect, useState } from 'react';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { BlockchainLink } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';

export const useDefaultUrls = (
    symbol: NetworkSymbol,
): { defaultUrls: string[]; isLoading: boolean } => {
    const [link, setLink] = useState<BlockchainLink>();
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setIsLoading(true);
        TrezorConnect.getCoinInfo({ coin: symbol }).then(result => {
            if (result.success) {
                setLink(result.payload.blockchainLink);
            }
            setIsLoading(false);
        });
    }, [symbol]);

    return { defaultUrls: link?.url ?? [], isLoading };
};
