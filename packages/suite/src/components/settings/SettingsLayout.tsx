import { ReactNode, useMemo } from 'react';

import { Column } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import {
    NavigationItem,
    PageHeader,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { useDiscovery, useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { SettingsLoading } from 'src/views/settings/SettingsLoader';

type SettingsLayoutProps = {
    title?: string;
    children?: ReactNode;
    ['data-testid']?: string;
};

const SettingsHeader = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const dispatch = useDispatch();

    const settingsSubpages = useMemo<Array<NavigationItem>>(
        () => [
            {
                id: 'settings-index',
                title: <Translation id="TR_GENERAL" />,
                position: 'primary',
                'data-testid': '@settings/menu/general',
                callback: () => dispatch(goto('settings-index', { preserveParams: true })),
            },
            {
                id: 'settings-device',
                title: <Translation id="TR_DEVICE" />,
                position: 'primary',
                'data-testid': '@settings/menu/device',
                callback: () => dispatch(goto('settings-device', { preserveParams: true })),
            },
            {
                id: 'settings-coins',
                title: <Translation id="TR_COINS" />,
                position: 'primary',
                'data-testid': '@settings/menu/wallet',
                callback: () => dispatch(goto('settings-coins', { preserveParams: true })),
            },
            {
                id: 'settings-connected-apps',
                title: <Translation id="TR_CONNECTED_APPS" />,
                position: 'primary',
                isHidden: !isDebugModeActive || !isDesktop(),
                'data-testid': '@settings/menu/connected-apps',
                callback: () => dispatch(goto('settings-connected-apps', { preserveParams: true })),
            },
            {
                id: 'settings-debug',
                title: <Translation id="TR_DEBUG_SETTINGS" />,
                position: 'primary',
                isHidden: !isDebugModeActive,
                'data-testid': '@settings/menu/debug',
                callback: () => dispatch(goto('settings-debug', { preserveParams: true })),
            },
        ],
        [dispatch, isDebugModeActive],
    );

    return (
        <>
            <PageHeader />
            <SubpageNavigation items={settingsSubpages} />
        </>
    );
};

export const SettingsLayout = ({
    title,
    children,
    'data-testid': dataTest,
}: SettingsLayoutProps) => {
    useLayout(title || 'Settings', <SettingsHeader />);

    const { isDiscoveryRunning } = useDiscovery();

    return (
        <div data-testid={dataTest}>
            <SettingsLoading isPresent={isDiscoveryRunning} />
            <Column gap={spacings.xxxxl}>{children}</Column>
        </div>
    );
};
