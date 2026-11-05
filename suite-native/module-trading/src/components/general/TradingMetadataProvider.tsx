import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingCoins } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { AccountTokenMetadataProvider } from '@suite-native/tokens';

import { InvityTokenMetadataProvider } from './InvityTokenMetadataProvider';

type TradingMetadataProviderProps = { children: ReactNode };

/** Composes discovered holdings and the trading catalog before trading UI is rendered. */
export const TradingMetadataProvider = ({ children }: TradingMetadataProviderProps) => {
    const accounts = useSelector(selectAccounts);
    const coins = useSelector(selectTradingCoins);

    return (
        <AccountTokenMetadataProvider accounts={accounts}>
            {/* Catalog labels take precedence; holdings supply missing precision and standards. */}
            <InvityTokenMetadataProvider coins={coins}>{children}</InvityTokenMetadataProvider>
        </AccountTokenMetadataProvider>
    );
};
