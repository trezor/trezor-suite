import { ElementType } from 'react';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { TradingLayoutHeader } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutHeader';

export interface TradingContainerProps {
    SectionComponent: ElementType;
}

export const TradingContainer = ({ SectionComponent }: TradingContainerProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    if (selectedAccount.status !== 'loaded') {
        return <TradingLayoutHeader />;
    }

    return (
        <TradingLayoutHeader>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: spacings.md }}>
                    <DiscoveryWarning />
                </Column>
            )}
            <SectionComponent selectedAccount={selectedAccount} />
            <TradingFooter />
        </TradingLayoutHeader>
    );
};
