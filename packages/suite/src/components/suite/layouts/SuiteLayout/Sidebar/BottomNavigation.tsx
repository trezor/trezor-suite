import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    NewContentIndicatorId,
    markNewContentIndicatorAsSeen,
    selectIsNewContentIndicatorVisible,
} from '@suite/flags';
import { Translation } from '@suite/intl';
import { type Route, selectRouteName } from '@suite/router';
import { selectIsDeviceUsingPassphrase } from '@suite-common/device';
import { Column, Divider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { GearSixIcon, GiftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';
import { selectIsReferralAvailable } from 'src/views/refer-a-friend/referralSelectors';

import { NavigationItem } from './NavigationItem';

const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
];

export const BottomNavigation = () => {
    const { isSidebarCollapsed } = useResponsiveContext();
    const { dispatch } = useServices(injectDispatch);
    const isReferralAvailable = useSelector(selectIsReferralAvailable);
    const isReferralDisabled = useSelector(selectIsDeviceUsingPassphrase);
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
                        isDisabled={isReferralDisabled}
                        tooltipContent={
                            isReferralDisabled ? (
                                <Translation id="TR_REFERRAL_SWITCH_TO_STANDARD_WALLET" />
                            ) : undefined
                        }
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
