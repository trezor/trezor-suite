import { useMemo } from 'react';

import styled from 'styled-components';

import type { Route } from '@suite-common/suite-types';

import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { findRouteByName } from 'src/utils/suite/router';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useGuide } from 'src/hooks/guide/useGuide';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';

import { MobileActionItem } from './MobileActionItem';
import { useEnabledBackends } from '../utils';

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 16px;
`;

interface MobileMenuActionsProps {
    closeMobileNavigation?: () => void;
}

export const MobileMenuActions = ({ closeMobileNavigation }: MobileMenuActionsProps) => {
    const activeApp = useSelector(state => state.router.app);
    const notifications = useSelector(state => state.notifications);
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const allowPrerelease = useSelector(state => state.desktopUpdate.allowPrerelease);
    const enabledBackends = useEnabledBackends();
    const dispatch = useDispatch();

    const { openGuide } = useGuide();

    const action = (...gotoArgs: Parameters<typeof goto>) => {
        dispatch(goto(...gotoArgs));
        if (closeMobileNavigation) closeMobileNavigation();
    };

    const handleOpenGuide = () => {
        closeMobileNavigation?.();
        openGuide();
    };
    const toggleDiscreetMode = () => dispatch(setDiscreetMode(!discreetMode));
    const getIfRouteIsActive = (route: Route['name']) => {
        const routeObj = findRouteByName(route);
        return routeObj ? routeObj.app === activeApp : false;
    };

    const unseenNotifications = useMemo(() => notifications.some(n => !n.seen), [notifications]);

    return (
        <MobileWrapper>
            <MobileActionItem
                onClick={toggleDiscreetMode}
                isActive={discreetMode}
                label={<Translation id="TR_DISCREET" />}
                icon={discreetMode ? 'HIDE' : 'SHOW'}
            />

            {!!enabledBackends.length && (
                <MobileActionItem
                    onClick={() => action('settings-coins')}
                    label={<Translation id="TR_BACKENDS" />}
                    icon="BACKEND"
                    indicator="check"
                />
            )}

            {allowPrerelease && (
                <MobileActionItem
                    onClick={() => action('settings-index')}
                    label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                    icon="EXPERIMENTAL"
                />
            )}

            <MobileActionItem
                label={<Translation id="TR_NOTIFICATIONS" />}
                data-test="@suite/menu/notifications-index"
                onClick={() => action('notifications-index')}
                isActive={getIfRouteIsActive('notifications-index')}
                icon="NOTIFICATION"
                indicator={unseenNotifications ? 'alert' : undefined}
            />

            <MobileActionItem
                label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />}
                data-test="@suite/menu/guide-index"
                onClick={handleOpenGuide}
                icon="LIGHTBULB"
            />

            <MobileActionItem
                label={<Translation id="TR_SETTINGS" />}
                data-test="@suite/menu/settings-index"
                onClick={() => action('settings-index')}
                isActive={getIfRouteIsActive('settings-index')}
                icon="SETTINGS"
            />
        </MobileWrapper>
    );
};
