import { useMemo } from 'react';

import styled from 'styled-components';

import type { Route } from '@suite-common/suite-types';

import { setDiscreetMode } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useGuide } from 'src/hooks/guide/useGuide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
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
                icon={discreetMode ? 'eyeSlash' : 'eye'}
            />

            {!!enabledBackends.length && (
                <MobileActionItem
                    onClick={() => action('settings-coins')}
                    label={<Translation id="TR_BACKENDS" />}
                    icon="database"
                    indicator="check"
                />
            )}

            {allowPrerelease && (
                <MobileActionItem
                    onClick={() => action('settings-index')}
                    label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                    icon="atom"
                />
            )}

            <MobileActionItem
                label={<Translation id="TR_NOTIFICATIONS" />}
                data-testid="@suite/menu/notifications-index"
                onClick={() => action('notifications-index')}
                isActive={getIfTabIsActive(['notifications-index'])}
                icon="bell"
                indicator={unseenNotifications ? 'alert' : undefined}
            />

            <MobileActionItem
                label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />}
                data-testid="@suite/menu/guide-index"
                onClick={handleOpenGuide}
                icon="lightbulb"
            />

            <MobileActionItem
                label={<Translation id="TR_SETTINGS" />}
                data-testid="@suite/menu/settings-index"
                onClick={() => action('settings-index')}
                isActive={getIfTabIsActive([
                    'settings-index',
                    'settings-device',
                    'settings-coins',
                    'settings-debug',
                    'settings-connected-apps',
                ])}
                icon="gear"
            />
        </MobileWrapper>
    );
};
