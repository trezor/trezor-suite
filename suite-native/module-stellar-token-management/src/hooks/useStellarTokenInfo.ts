import { useEffect, useState } from 'react';

import type { StellarTokenInfo, TokenAddress } from '@suite-common/wallet-types';
import { STELLAR_DECIMALS } from '@trezor/blockchain-link-utils/src/stellar';

import { lazyTokenMetadata } from './useInactiveStellarTokens';

export const useStellarTokenInfo = (tokenContract: TokenAddress) => {
    const [tokenInfo, setTokenInfo] = useState<StellarTokenInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadTokenInfo = async () => {
            setIsLoading(true);

            const symbol = tokenContract.split('-')[0];

            try {
                const tokenMetadata = await lazyTokenMetadata.getOrInit();
                const metadata = tokenMetadata?.[tokenContract];

                setTokenInfo({
                    standard: 'STELLAR-CLASSIC',
                    contract: tokenContract,
                    name: metadata?.name,
                    symbol,
                    decimals: STELLAR_DECIMALS,
                    homeDomain: metadata?.home_domain,
                    rating: metadata?.rating,
                });
            } catch {
                setTokenInfo({
                    standard: 'STELLAR-CLASSIC',
                    contract: tokenContract,
                    symbol,
                    decimals: STELLAR_DECIMALS,
                });
            }
            setIsLoading(false);
        };

        loadTokenInfo();
    }, [tokenContract]);

    return { tokenInfo, isLoading };
};
