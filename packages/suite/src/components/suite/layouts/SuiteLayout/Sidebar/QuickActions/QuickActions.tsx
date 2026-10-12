import { UpdateStatusActionBarIcon } from '@suite/desktop-update';
import { SuiteSyncQuickAction } from '@suite/suite-sync';
import { Flex } from '@trezor/components';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';

type QuickActionsProps = {
    isSidebarCollapsed: boolean;
};

export const QuickActions = ({ isSidebarCollapsed }: QuickActionsProps) => (
    <Flex
        gap={isSidebarCollapsed ? 2 : 6}
        padding={{ horizontal: 8, vertical: isSidebarCollapsed ? 10 : 6 }}
        alignItems="center"
        direction={isSidebarCollapsed ? 'column' : 'row'}
    >
        <UpdateStatusActionBarIcon isSidebarCollapsed={isSidebarCollapsed} />
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <SuiteSyncQuickAction />
        <HideBalances />
    </Flex>
);
