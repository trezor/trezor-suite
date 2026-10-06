import { type PropsWithChildren } from 'react';

import { selectRouteName } from '@suite/router';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column, Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingLayoutNavigation } from 'src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

export const TradingLayout = ({ children }: PropsWithChildren) => {
    const routeName = useSelector(selectRouteName);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    useTradingPageHeader();

    return (
        <Column data-testid="@trading" gap={16}>
            {isDiscoveryRunning && <DiscoveryWarning />}
            <Row justifyContent="center">
                <TradingLayoutNavigation route={routeName} />
            </Row>
            {children}
        </Column>
    );
};
