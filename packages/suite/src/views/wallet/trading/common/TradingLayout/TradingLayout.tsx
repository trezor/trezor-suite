import { type PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { selectRouteName } from '@suite/router';
import { selectIsAllTradingDisabled } from '@suite-common/message-system';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column, Row } from '@trezor/components';

import { DiscoveryWarning } from '#src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingLayoutNavigation } from '#src/views/wallet/trading/common/TradingLayout/TradingLayoutNavigation';
import { useTradingPageHeader } from '#src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';

export const TradingLayout = ({ children }: PropsWithChildren) => {
    const routeName = useSelector(selectRouteName);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isAllTradingDisabled = useSelector(selectIsAllTradingDisabled);

    useTradingPageHeader();

    return (
        <Column data-testid="@trading" gap={16}>
            {isDiscoveryRunning && <DiscoveryWarning />}
            {!isAllTradingDisabled && (
                <Row justifyContent="center">
                    <TradingLayoutNavigation route={routeName} />
                </Row>
            )}
            {children}
        </Column>
    );
};
