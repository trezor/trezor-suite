import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectCoinDefinitions,
} from '@suite-common/token-definitions';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type StellarTokenInfo } from '@suite-common/wallet-types';
import { type TokenDetailByMint } from '@trezor/blockchain-link-types';
import { STELLAR_DECIMALS, getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import { createLazy } from '@trezor/utils';

export const lazyTokenMetadata = createLazy(getTokenMetadata);

export const useInactiveStellarTokens = (accountKey?: AccountKey) => {
    const [tokenMetadata, setTokenMetadata] = useState<TokenDetailByMint | null>(
        lazyTokenMetadata.get() ?? null,
    );
    const [isMetadataLoading, setIsMetadataLoading] = useState(!lazyTokenMetadata.get());

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const coinDefinitions = useSelector((state: TokenDefinitionsRootState) =>
        selectCoinDefinitions(state, account?.symbol ?? 'xlm'),
    );

    const isCoinDefinitionsLoading = coinDefinitions?.isLoading ?? false;

    useEffect(() => {
        if (!tokenMetadata) {
            setIsMetadataLoading(true);
            lazyTokenMetadata
                .getOrInit()
                .then(setTokenMetadata)
                .catch(() => setTokenMetadata(null))
                .finally(() => setIsMetadataLoading(false));
        }
    }, [tokenMetadata]);

    const activatedTokenContracts = useMemo(() => {
        if (!account?.tokens) return new Set<string>();

        return new Set(account.tokens.map(token => token.contract));
    }, [account?.tokens]);

    const inactiveTokens = useMemo(() => {
        const tokenAddresses = coinDefinitions?.data ?? [];

        return tokenAddresses
            .filter(contract => !activatedTokenContracts.has(contract))
            .map((contract): StellarTokenInfo => {
                const metadata = tokenMetadata?.[contract];
                const symbol = contract.split('-')[0];

                return {
                    standard: 'STELLAR-CLASSIC',
                    contract,
                    name: metadata?.name,
                    symbol,
                    decimals: STELLAR_DECIMALS,
                    homeDomain: metadata?.home_domain,
                    rating: metadata?.rating,
                };
            })
            .sort((a, b) => {
                if (a.rating == null && b.rating == null) return 0;
                if (a.rating == null) return 1;
                if (b.rating == null) return -1;

                return b.rating - a.rating;
            });
    }, [coinDefinitions?.data, activatedTokenContracts, tokenMetadata]);

    const isLoading = isCoinDefinitionsLoading || isMetadataLoading;

    return {
        inactiveTokens,
        isLoading,
    };
};
