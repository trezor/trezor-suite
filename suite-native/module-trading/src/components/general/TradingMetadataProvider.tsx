import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { TokenMetadataProvider } from '@suite-common/token';
import { selectTradingCoins } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { accountsToTokenMetadataSources } from '@suite-native/tokens';

import { invityCoinsToTokenMetadataSources } from '../../utils/general/invityCoinsToTokenMetadataSources';

type TradingMetadataProviderProps = { children: ReactNode };

/** Composes discovered holdings and the trading catalog before trading UI is rendered. */
export const TradingMetadataProvider = ({ children }: TradingMetadataProviderProps) => {
    const accounts = useSelector(selectAccounts);
    const coins = useSelector(selectTradingCoins);

    return (
        <TokenMetadataProvider
            sources={[
                // Catalog labels take precedence; holdings supply missing precision and standards.
                ...invityCoinsToTokenMetadataSources(coins),
                ...accountsToTokenMetadataSources(accounts),
            ]}
        >
            {children}
        </TokenMetadataProvider>
    );
};
