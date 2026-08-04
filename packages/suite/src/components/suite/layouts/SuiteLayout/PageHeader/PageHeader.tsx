import { type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { selectSelectedAccountKey } from '@suite/account';
import {
    isAccountTabRoute,
    resolveEffectiveBackgroundRouteName,
    selectRoute,
    selectSuiteRouterHistoryDep,
} from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectAccounts } from '@suite-common/wallet-core';
import { Row } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import { GlobalSendReceive } from './GlobalSendReceive/GlobalSendReceive';
import { HeaderActions } from './HeaderActions';
import { PageName } from './PageNames/PageName';

const Container = styled.div<{ $expandable?: boolean }>`
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
    min-height: ${HEADER_HEIGHT};
    padding: 8px 16px;
    background: ${({ theme }) => theme.surfaceFillPage};
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
    z-index: ${zIndices.pageHeader};

    ${({ $expandable }) =>
        !$expandable &&
        css`
            height: ${HEADER_HEIGHT};
            overflow: hidden;
        `}
`;

const PageHeaderIndex = () => {
    const hasAccounts = useSelector(state => selectAccounts(state).length > 0);

    if (!hasAccounts) return null;

    return (
        <Row gap={12}>
            <GlobalSendReceive />
        </Row>
    );
};

interface PageHeaderProps {
    children?: ReactNode;
    expandable?: boolean;
}

export const PageHeader = ({ children, expandable }: PageHeaderProps) => {
    const selectedAccountKey = useSelector(selectSelectedAccountKey);
    const route = useSelector(selectRoute);
    const { suiteRouterHistory } = useServices(selectSuiteRouterHistoryDep);
    const effectiveRouteName = resolveEffectiveBackgroundRouteName(
        route,
        suiteRouterHistory.getLocation(),
    );
    const isAccountTabPage = isAccountTabRoute(effectiveRouteName);

    // handle moment when children are not rendered yet in the Trade section
    const isTradeSection = !!effectiveRouteName?.includes('wallet-trading');

    if (isTradeSection || children != null) {
        return <Container $expandable={expandable}>{children}</Container>;
    }

    return (
        <Container>
            <PageName />

            {effectiveRouteName === 'suite-index' && <PageHeaderIndex />}
            {!!selectedAccountKey && isAccountTabPage && <HeaderActions />}
        </Container>
    );
};
