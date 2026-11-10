import { type ReactNode } from 'react';

import type { TradingProviderInfo } from '@suite-common/trading';

import { TradingFooter } from './TradingFooter/TradingFooter';
import { useTradingPageHeader } from './TradingLayout/useTradingPageHeader';

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
