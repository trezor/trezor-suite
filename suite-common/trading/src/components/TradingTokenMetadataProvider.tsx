import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { TokenMetadataProvider } from '@suite-common/token';

import { selectTradingTokenMetadataSources } from '../selectors/tradingSelectors';

type TradingTokenMetadataProviderProps = {
    children: ReactNode;
};

/** Provides the trading catalog once, so a token the user does not hold has a name and symbol. */
export const TradingTokenMetadataProvider = ({ children }: TradingTokenMetadataProviderProps) => {
    const sources = useSelector(selectTradingTokenMetadataSources);

    return <TokenMetadataProvider sources={sources}>{children}</TokenMetadataProvider>;
};
