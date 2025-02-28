import React from 'react';

import styled from 'styled-components';

import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { getFailedAccounts, sortByCoin } from '@suite-common/wallet-utils';
import { Column, Row, SkeletonRectangle, useScrollShadow } from '@trezor/components';
import { spacings, spacingsPx, zIndices } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AccountSearchBox } from './AccountSearchBox';
import { AccountsList } from './AccountsList';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { AddAccountButton } from './AddAccountButton';
import { CoinsFilter } from './CoinsFilter';
import { RefreshAfterDiscoveryNeeded } from './RefreshAfterDiscoveryNeeded';
import { CollapsedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/CollapsedSidebarOnly';
import { ExpandedSidebarOnly } from '../../../suite/layouts/SuiteLayout/Sidebar/ExpandedSidebarOnly';
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
    const device = useSelector(selectSelectedDevice);
    const accounts = useSelector(state => state.wallet.accounts);
    const { discovery } = useDiscovery();
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();
    const isSidebarCollapsed = useIsSidebarCollapsed();
    const isDiscoveryRunning = discovery?.status === DiscoveryStatus.RUNNING;

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
                        {isDiscoveryRunning ? (
                            <SkeletonRectangle animate width="100%" height={38} />
                        ) : (
                            <>
                                {!isEmpty && <AccountSearchBox />}
                                <AddAccountButton
                                    isFullWidth={isEmpty}
                                    data-testid="@account-menu/add-account"
                                    device={device}
                                />
                            </>
                        )}
                    </Row>
                    <CoinsFilter />
                </ExpandedSidebarOnly>
                <CollapsedSidebarOnly>
                    <Column alignItems="center" margin={{ bottom: spacings.sm }}>
                        <AddAccountButton
                            isFullWidth={false}
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
