import { useMemo } from 'react';

import styled from 'styled-components';

import type { Route } from '@suite-common/suite-types';

import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useGuide } from 'src/hooks/guide/useGuide';
import { selectIsDiscreteModeActive } from 'src/reducers/wallet/settingsReducer';

import { MobileActionItem } from './MobileActionItem';
import { useEnabledBackends } from '../utils';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

const MobileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 16px;
`;

interface MobileMenuActionsProps {
    closeMobileNavigation?: () => void;
}

export const MobileMenuActions = ({ closeMobileNavigation }: MobileMenuActionsProps) => {
    const notifications = useSelector(state => state.notifications);
    const discreetMode = useSelector(selectIsDiscreteModeActive);
    const activeRoute = useSelector(selectRouteName);
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
    const getIfTabIsActive = (routes: Route['name'][]): boolean =>
        routes?.some(route => route === activeRoute);

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
                data-test-id="@suite/menu/notifications-index"
                onClick={() => action('notifications-index')}
                isActive={getIfTabIsActive(['notifications-index'])}
                icon="NOTIFICATION"
                indicator={unseenNotifications ? 'alert' : undefined}
            />

            <MobileActionItem
                label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />}
                data-test-id="@suite/menu/guide-index"
                onClick={handleOpenGuide}
                icon="LIGHTBULB"
            />

            <MobileActionItem
                label={<Translation id="TR_SETTINGS" />}
                data-test-id="@suite/menu/settings-index"
                onClick={() => action('settings-index')}
                isActive={getIfTabIsActive([
                    'settings-index',
                    'settings-device',
                    'settings-coins',
                    'settings-debug',
                ])}
                icon="SETTINGS"
            />
        </MobileWrapper>
    );
};
