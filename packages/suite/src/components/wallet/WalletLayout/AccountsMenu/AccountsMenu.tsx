import { useMemo } from 'react';

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

// The account list scrolls itself and positions its sections against its own height, so the
// area it lives in has to be definite rather than growing with the content.
const ListArea = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
`;

export const AccountsMenu = () => {
    const device = useSelector(selectSelectedDevice);
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const { scrollElementRef, ScrollSentinels, ShadowTop, ShadowBottom, ShadowContainer } =
        useScrollShadow({
            backgroundColor: 'surfaceFillSunken',
        });
    const { isSidebarCollapsed } = useResponsiveContext();

    // Kept referentially stable so that the shadows switching on and off cannot re-render the
    // list itself.
    const scrollSentinels = useMemo(() => <ScrollSentinels />, [ScrollSentinels]);

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
            <ListArea>
                <ShadowContainer>
                    <ShadowTop />
                    <AccountsList
                        scrollElementRef={scrollElementRef}
                        scrollSentinels={scrollSentinels}
                    />
                    <ShadowBottom />
                </ShadowContainer>
            </ListArea>
        </ReduxAccountSearchProvider>
    );
};
