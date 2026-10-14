import { type ReactNode } from 'react';

import type { TradingProviderInfo } from '@suite-common/trading';

import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

export interface TradingContainerProps {
    children: ReactNode;
    provider?: TradingProviderInfo;
}

export const TradingContainer = ({ children, provider }: TradingContainerProps) => {
    useTradingPageHeader();

    return (
        <>
            {children}
            <TradingFooter provider={provider} />
        </>
    );
};
