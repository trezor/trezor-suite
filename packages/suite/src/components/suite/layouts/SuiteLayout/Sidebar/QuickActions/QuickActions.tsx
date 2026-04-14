import { UpdateStatusActionBarIcon } from '@suite/desktop-update';
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
        gap={16}
        padding={16}
        alignItems="center"
        justifyContent="space-evenly"
        direction={isSidebarCollapsed ? 'column' : 'row'}
    >
        <UpdateStatusActionBarIcon isSidebarCollapsed={isSidebarCollapsed} />
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <HideBalances />
    </Flex>
);
