import { type PropsWithChildren } from 'react';

import { selectRouteName } from '@suite/router';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column, Row } from '@trezor/components';

import { TradingLayoutNavigation } from './TradingLayoutNavigation';
import { useTradingPageHeader } from './useTradingPageHeader';
import { useSelector } from '../../../../../hooks/suite';
import { DiscoveryWarning } from '../../../staking/components/StakingDashboard/components/DiscoveryWarning';

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
