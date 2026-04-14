import { type ReactNode } from 'react';

import styled from 'styled-components';

import { isAccountTabRoute, resolveEffectiveBackgroundRouteName, selectRoute } from '@suite/router';
import { selectAccounts } from '@suite-common/wallet-core';
import { Row } from '@trezor/components';
import { spacingsPx, zIndices } from '@trezor/theme';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccountKey } from 'src/reducers/wallet/selectedAccountReducer';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { GlobalSendReceive } from './GlobalSendReceive/GlobalSendReceive';
import { HeaderActions } from './HeaderActions';
import { HeaderDropdown } from './HeaderDropdown';
import { PageName } from './PageNames/PageName';
import { TradeActions } from './TradeActions';

const Container = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: ${spacingsPx.xs};
    height: ${HEADER_HEIGHT};
    min-height: ${HEADER_HEIGHT};
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    overflow: hidden;
    z-index: ${zIndices.pageHeader};
`;

const PageHeaderIndex = () => {
    const hasAccounts = useSelector(state => selectAccounts(state).length > 0);

    if (!hasAccounts) return null;

    return (
        <Row gap={12}>
            <HeaderDropdown />
            <TradeActions />
            <GlobalSendReceive />
        </Row>
    );
};

interface PageHeaderProps {
    children?: ReactNode;
}

export const PageHeader = ({ children }: PageHeaderProps) => {
    const selectedAccountKey = useSelector(selectSelectedAccountKey);
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useSuiteServices();
    const effectiveRouteName = resolveEffectiveBackgroundRouteName(
        route,
        suiteRouterHistory.getLocation(),
    );
    const isAccountTabPage = isAccountTabRoute(effectiveRouteName);

    // handle moment when children are not rendered yet in the Trade section
    const isTradeSection = !!effectiveRouteName?.includes('wallet-trading');

    if (isTradeSection || children != null) {
        return <Container>{children}</Container>;
    }

    return (
        <Container>
            <PageName />

            {effectiveRouteName === 'suite-index' && <PageHeaderIndex />}
            {!!selectedAccountKey && isAccountTabPage && <HeaderActions />}
        </Container>
    );
};
