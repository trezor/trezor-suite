import { type ReactNode } from 'react';

import { type Account } from '@suite-common/wallet-types';

import { TokenMetadataProvider } from './TokenMetadataProvider';

type AccountTokenMetadataProviderProps = {
    accounts: readonly Account[];
    children: ReactNode;
};

/** Supplies token metadata discovered in account holdings. */
export const AccountTokenMetadataProvider = ({
    accounts,
    children,
}: AccountTokenMetadataProviderProps) => (
    <TokenMetadataProvider
        sources={accounts.map(account => ({
            networkSymbol: account.symbol,
            tokens: account.tokens ?? [],
        }))}
    >
        {children}
    </TokenMetadataProvider>
);
