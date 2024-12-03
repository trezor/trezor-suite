import React from 'react';

import styled from 'styled-components';

import { spacings, spacingsPx, zIndices } from '@trezor/theme';
import { selectDevice } from '@suite-common/wallet-core';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import { useScrollShadow, Row, Column } from '@trezor/components';

import { useDiscovery, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';

import { AccountSearchBox } from './AccountSearchBox';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { AccountsList } from './AccountsList';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { RefreshAfterDiscoveryNeeded } from './RefreshAfterDiscoveryNeeded';
import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    overflow: auto;
    gap: ${spacingsPx.sm};
`;

const Header = styled.div`
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: ${spacingsPx.sm} ${spacingsPx.xs};
    padding-bottom: 0;
`;

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectDevice);
    const accounts = useSelector(state => state.wallet.accounts);
    const { discovery } = useDiscovery();
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();
    const isSidebarCollapsed = useIsSidebarCollapsed();

    if (!device || !discovery) {
        if (isSidebarCollapsed) return <Wrapper />;

        return (
            <Wrapper>
                <AccountsMenuNotice>
                    <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
                </AccountsMenuNotice>
            </Wrapper>
        );
    }

    const failed = getFailedAccounts(discovery);
    const list = sortByCoin(
        accounts.filter(a => a.deviceState === device.state?.staticSessionId).concat(failed),
    );
    const isEmpty = list.length === 0;

    return (
        <Wrapper>
            <Header>
                <ExpandedSidebarOnly>
                    <Row justifyContent="space-between" gap={spacings.xs}>
                        {!isEmpty && <AccountSearchBox />}
                        <AddAccountButton
                            isFullWidth={isEmpty}
                            data-testid="@account-menu/add-account"
                            device={device}
                        />
                    </Row>
                    <CoinsFilter />
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" margin={{ bottom: spacings.sm }}>
                        <AddAccountButton
                            isFullWidth={isEmpty}
                            data-testid="@account-menu/add-account"
                            device={device}
                        />
                    </Column>
                </CollapsedSidebarOnly>
            </Header>
            <ShadowContainer>
                <ShadowTop backgroundColor="backgroundSurfaceElevationNegative" />
                <ScrollContainer ref={scrollElementRef} onScroll={onScroll}>
                    <AccountsList />
                    <RefreshAfterDiscoveryNeeded />
                </ScrollContainer>
                <ShadowBottom backgroundColor="backgroundSurfaceElevationNegative" />
            </ShadowContainer>
        </Wrapper>
    );
};
