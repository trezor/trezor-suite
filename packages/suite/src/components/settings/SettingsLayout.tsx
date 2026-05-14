import { type ReactNode, useMemo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectIsDebugModeActive } from '@suite/settings';
import { Box, Column, motionEasing } from '@trezor/components';

import {
    type NavigationItem,
    PageHeader,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { useDiscovery, useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { AccountHeaderProvider } from 'src/support/suite/AccountHeaderProvider';
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
                callback: () =>
                    dispatch(goto({ routeName: 'settings-index', preserveParams: true })),
            },
            {
                id: 'settings-device',
                title: <Translation id="TR_DEVICE" />,
                position: 'primary',
                'data-testid': '@settings/menu/device',
                callback: () =>
                    dispatch(goto({ routeName: 'settings-device', preserveParams: true })),
            },
            {
                id: 'settings-coins',
                title: <Translation id="TR_COINS" />,
                position: 'primary',
                'data-testid': '@settings/menu/wallet',
                callback: () =>
                    dispatch(goto({ routeName: 'settings-coins', preserveParams: true })),
            },
            {
                id: 'settings-connected-apps',
                title: <Translation id="TR_CONNECTED_APPS" />,
                position: 'primary',
                'data-testid': '@settings/menu/connected-apps',
                callback: () =>
                    dispatch(goto({ routeName: 'settings-connected-apps', preserveParams: true })),
            },
            {
                id: 'settings-debug',
                title: <Translation id="TR_DEBUG_SETTINGS" />,
                position: 'primary',
                isHidden: !isDebugModeActive,
                'data-testid': '@settings/menu/debug',
                callback: () =>
                    dispatch(goto({ routeName: 'settings-debug', preserveParams: true })),
            },
        ],
        [dispatch, isDebugModeActive],
    );

    return (
        <AccountHeaderProvider>
            <PageHeader />
            <SubpageNavigation data-testid="@settings/menu" items={settingsSubpages} />
        </AccountHeaderProvider>
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
            <AnimatePresence>
                {isDiscoveryRunning && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: motionEasing.transition }}
                    >
                        <Box padding={{ bottom: 32 }}>
                            <SettingsLoading />
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
            <Column gap={48}>{children}</Column>
        </div>
    );
};
