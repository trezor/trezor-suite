import React from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useScrollShadow } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { ReduxAccountSearchProvider } from 'src/hooks/suite/useAccountSearch';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { AccountsList } from './AccountsList';
import { AccountsMenuHeader } from './AccountsMenuHeader';
import { AccountsMenuNotice } from './AccountsMenuNotice';
import { RefreshAfterDiscoveryNeeded } from './RefreshAfterDiscoveryNeeded';

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectSelectedDevice);

    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();
    const { isSidebarCollapsed } = useResponsiveContext();

    if (!device) {
        if (isSidebarCollapsed) return null;

        return (
            <AccountsMenuNotice>
                <Translation id="TR_ACCOUNT_NO_ACCOUNTS" />
            </AccountsMenuNotice>
        );
    }

    return (
        <ReduxAccountSearchProvider>
            <AccountsMenuHeader />
            <ShadowContainer>
                <ShadowTop backgroundColor="backgroundSurfaceElevationNegative" />
                <ScrollContainer ref={scrollElementRef} onScroll={onScroll}>
                    <AccountsList />

                    <RefreshAfterDiscoveryNeeded />
                </ScrollContainer>
                <ShadowBottom backgroundColor="backgroundSurfaceElevationNegative" />
            </ShadowContainer>
        </ReduxAccountSearchProvider>
    );
};
