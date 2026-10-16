import { useEffect } from 'react';

import {
    NewContentIndicatorId,
    markNewContentIndicatorAsSeen,
    selectIsNewContentIndicatorVisible,
} from '@suite/flags';
import { type Route, selectRouteName } from '@suite/router';
import { selectPhysicalDeviceWallets } from '@suite-common/device';
import { getIsDeviceInitialized } from '@suite-common/suite-utils';
import { Column, Divider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { GearSixIcon, GiftIcon } from '@trezor/icons';
import { createWeakMapSelector, injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { NavigationItem } from './NavigationItem';

const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
];

const selectHasSetUpTrezorWallet = createWeakMapSelector([selectPhysicalDeviceWallets], devices =>
    devices.some(
        device =>
            !!device.state &&
            getIsDeviceInitialized({
                deviceMode: device.mode,
                deviceFeatures: device.features,
            }),
    ),
);

export const BottomNavigation = () => {
    const { isSidebarCollapsed } = useResponsiveContext();
    const { dispatch } = useServices(injectDispatch);
    const isReferralAvailable = useSelector(selectHasSetUpTrezorWallet);
    const routeName = useSelector(selectRouteName);
    const isReferralNewContentIndicatorVisible = useSelector(
        selectIsNewContentIndicatorVisible(NewContentIndicatorId.ReferAFriend26_10),
    );
    const isReferralOpen = routeName === 'suite-refer-a-friend';

    useEffect(() => {
        if (isReferralAvailable && isReferralOpen && isReferralNewContentIndicatorVisible) {
            dispatch(markNewContentIndicatorAsSeen(NewContentIndicatorId.ReferAFriend26_10));
        }
    }, [dispatch, isReferralAvailable, isReferralOpen, isReferralNewContentIndicatorVisible]);

    return (
        <>
            <Divider margin={0} color="surfaceBorderSunken" />
            <Column
                alignItems={isSidebarCollapsed ? 'center' : 'stretch'}
                gap={4}
                margin={8}
                flex="0 0 auto"
                as="nav"
                data-testid="@suite/menu/bottom-navigation"
            >
                {isReferralAvailable && (
                    <NavigationItem
                        nameId="TR_REFER_A_FRIEND"
                        icon={GiftIcon}
                        goToRoute="suite-refer-a-friend"
                        routes={['suite-refer-a-friend']}
                        hasNewContentIndicator={isReferralNewContentIndicatorVisible}
                    />
                )}
                <NavigationItem
                    nameId="TR_SETTINGS"
                    icon={GearSixIcon}
                    goToRoute="settings-index"
                    routes={SETTINGS_ROUTES}
                    data-testid="@suite/menu/settings"
                    shortcut={['MOD', 'COMMA']}
                />
            </Column>
            <Divider margin={0} color="surfaceBorderSunken" />
        </>
    );
};
