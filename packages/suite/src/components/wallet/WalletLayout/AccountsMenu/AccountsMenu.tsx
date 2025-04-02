import React from 'react';

import styled from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useScrollShadow } from '@trezor/components';
import { spacingsPx, zIndices } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AccountsList } from './AccountsList';
import { AccountsMenuHeader } from './AccountsMenuHeader';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { RefreshAfterDiscoveryNeeded } from './RefreshAfterDiscoveryNeeded';
import { useIsSidebarCollapsed } from '../../../suite/layouts/SuiteLayout/Sidebar/utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    overflow: auto;
    gap: ${spacingsPx.sm};
`;

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectSelectedDevice);

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

    return (
        <Wrapper>
            <AccountsMenuHeader discovery={discovery} />
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
