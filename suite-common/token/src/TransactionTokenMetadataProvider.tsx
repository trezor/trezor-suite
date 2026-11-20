import { type ReactNode } from 'react';

import { toTokenAddress } from '@suite-common/tokens';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type TokenMetadataSource } from './TokenMetadataContext';
import { TokenMetadataProvider } from './TokenMetadataProvider';

type TransactionTokenMetadataProviderProps = {
    transaction: WalletAccountTransaction;
    children: ReactNode;
};

export const TransactionTokenMetadataProvider = ({
    transaction,
    children,
}: TransactionTokenMetadataProviderProps) => {
    const sources: TokenMetadataSource[] = [
        {
            networkSymbol: transaction.symbol,
            tokens: transaction.tokens.map(transfer => ({
                contract: toTokenAddress(transfer.contract),
                name: transfer.name,
                symbol: transfer.symbol,
                decimals: transfer.decimals,
                standard: transfer.standard,
            })),
        },
    ];

    return <TokenMetadataProvider sources={sources}>{children}</TokenMetadataProvider>;
};
