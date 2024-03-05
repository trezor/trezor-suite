import { ReactNode, useMemo } from 'react';
import { useDiscovery, useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { SettingsLoading } from 'src/views/settings/SettingsLoader';
import {
    PageHeader,
    NavigationItem,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { goto } from 'src/actions/suite/routerActions';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { Translation } from 'src/components/suite';

type SettingsLayoutProps = {
    title?: string;
    children?: ReactNode;
    ['data-test']?: string;
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
                'data-test': '@settings/menu/general',
                callback: () => dispatch(goto('settings-index', { preserveParams: true })),
            },
            {
                id: 'settings-device',
                title: <Translation id="TR_DEVICE" />,
                position: 'primary',
                'data-test': '@settings/menu/device',
                callback: () => dispatch(goto('settings-device', { preserveParams: true })),
            },
            {
                id: 'settings-coins',
                title: <Translation id="TR_COINS" />,
                position: 'primary',
                'data-test': '@settings/menu/wallet',
                callback: () => dispatch(goto('settings-coins', { preserveParams: true })),
            },
            {
                id: 'settings-debug',
                title: <Translation id="TR_DEBUG_SETTINGS" />,
                position: 'primary',
                isHidden: !isDebugModeActive,
                'data-test': '@settings/menu/debug',
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

export const SettingsLayout = ({ title, children, 'data-test': dataTest }: SettingsLayoutProps) => {
    useLayout(title || 'Settings', SettingsHeader);

    const { isDiscoveryRunning } = useDiscovery();

    return (
        <div data-test={dataTest}>
            <SettingsLoading isPresent={isDiscoveryRunning} />
            <>{children}</>
        </div>
    );
};
