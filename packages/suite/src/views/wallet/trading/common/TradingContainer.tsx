import { type ReactNode } from 'react';

import type { TradingProviderInfo } from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

export interface TradingContainerProps {
    children: ReactNode;
    provider?: TradingProviderInfo;
}

export const TradingContainer = ({ children, provider }: TradingContainerProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    useTradingPageHeader();

    return (
        <>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: 16 }}>
                    <DiscoveryWarning />
                </Column>
            )}
            {children}
            <TradingFooter provider={provider} />
        </>
    );
};
