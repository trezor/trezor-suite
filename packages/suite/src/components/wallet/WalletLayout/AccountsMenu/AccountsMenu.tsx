import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { Column, useScrollShadow } from '@trezor/components';

import { ReduxAccountSearchProvider } from 'src/hooks/suite/useAccountSearch';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { AccountsList } from './AccountsList';
import { AccountsMenuHeader } from './AccountsMenuHeader';
import { AccountsMenuNotice } from './AccountsMenuNotice';

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
            <Column minHeight={0}>
                <ShadowContainer>
                    <ShadowTop />
                    <AccountsList
                        scrollElementRef={scrollElementRef}
                        scrollSentinels={scrollSentinels}
                    />
                    <ShadowBottom />
                </ShadowContainer>
            </Column>
        </ReduxAccountSearchProvider>
    );
};
