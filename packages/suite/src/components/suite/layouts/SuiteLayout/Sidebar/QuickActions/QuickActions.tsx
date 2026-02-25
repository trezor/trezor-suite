import { FeedbackFormManager } from '@suite/experimental-feedback';
import { Box, Column, Divider, ElevationUp, Flex } from '@trezor/components';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';

type QuickActionsProps = {
    isSidebarCollapsed: boolean;
    hideUpdateQuickAction: boolean;
};

export const QuickActions = ({ isSidebarCollapsed, hideUpdateQuickAction }: QuickActionsProps) => (
    <Column>
        <ElevationUp>
            <Box padding={16}>
                <FeedbackFormManager />
            </Box>
        </ElevationUp>

        <Divider margin={{ bottom: 4 }} />

        <Flex
            gap={16}
            padding={16}
            alignItems="center"
            justifyContent="space-evenly"
            direction={isSidebarCollapsed ? 'column' : 'row'}
        >
            <UpdateStatusActionBarIcon hideUpdateQuickAction={hideUpdateQuickAction} />
            <DebugAndExperimental />
            <CustomBackend />
            <Tor />
            <HideBalances />
        </Flex>
    </Column>
);
