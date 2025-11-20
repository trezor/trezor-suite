import { Column, Divider, Flex } from '@trezor/components';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';

type QuickActionsProps = {
    hideDeviceUpdateStatusBar?: boolean;
    isSidebarCollapsed: boolean;
    showUpdateBannerNotification?: boolean;
};

export const QuickActions = ({
    hideDeviceUpdateStatusBar,
    isSidebarCollapsed,
    showUpdateBannerNotification,
}: QuickActionsProps) => (
    <Column>
        <Divider margin={{ bottom: 4 }} />
        <Flex
            gap={16}
            padding={16}
            alignItems="center"
            justifyContent="space-evenly"
            direction={isSidebarCollapsed ? 'column' : 'row'}
        >
            <UpdateStatusActionBarIcon
                hideDeviceUpdateStatusBar={Boolean(hideDeviceUpdateStatusBar)}
                showUpdateBannerNotification={Boolean(showUpdateBannerNotification)}
            />
            <DebugAndExperimental />
            <CustomBackend />
            <Tor />
            <HideBalances />
        </Flex>
    </Column>
);
