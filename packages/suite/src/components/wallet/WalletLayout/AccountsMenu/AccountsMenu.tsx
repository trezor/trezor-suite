import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useScrollShadow } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { ReduxAccountSearchProvider } from 'src/hooks/suite/useAccountSearch';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountsList } from './AccountsList';
import { AccountsMenuHeader } from './AccountsMenuHeader';
import { AccountsMenuNotice } from './AccountsMenuNotice';

const ScrollContainer = styled.div`
    height: auto;
    overflow: hidden auto;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectSelectedDevice);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow();
    const { isSidebarCollapsed } = useResponsiveContext();

    const isDiscoveryEmpty = discoveryStatus?.type === 'discovery-empty';

    if (isDiscoveryEmpty) {
        return null;
    }

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
                <ShadowTop backgroundColor="surfaceFillSunken" />
                <ScrollContainer ref={scrollElementRef} onScroll={onScroll}>
                    <AccountsList />
                </ScrollContainer>
                <ShadowBottom backgroundColor="surfaceFillSunken" />
            </ShadowContainer>
        </ReduxAccountSearchProvider>
    );
};
