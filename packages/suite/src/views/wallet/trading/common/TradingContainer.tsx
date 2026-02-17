import { ElementType } from 'react';

import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { TradingLayoutHeader } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutHeader';

export interface TradingContainerProps {
    SectionComponent: ElementType;
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
}

export const TradingContainer = ({ SectionComponent, provider }: TradingContainerProps) => {
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <TradingLayoutHeader>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: spacings.md }}>
                    <DiscoveryWarning />
                </Column>
            )}
            <SectionComponent />
            <TradingFooter provider={provider} />
        </TradingLayoutHeader>
    );
};
