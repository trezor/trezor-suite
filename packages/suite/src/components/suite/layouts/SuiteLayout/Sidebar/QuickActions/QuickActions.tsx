import { FeedbackFormManager } from '@suite/experimental-feedback';
import type { ExperimentalFeature } from '@suite/experimental';
import {
    ExperimentalFeedbackRootState,
    selectPendingFeedbackFeature,
} from '@suite-common/feedback';
import { Box, Column, Divider, ElevationContext, Flex } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';

type QuickActionsProps = {
    isSidebarCollapsed: boolean;
    hideUpdateQuickAction: boolean;
};

export const QuickActions = ({ isSidebarCollapsed, hideUpdateQuickAction }: QuickActionsProps) => {
    const pendingFeedbackFeature = useSelector(
        (state: ExperimentalFeedbackRootState<ExperimentalFeature>) =>
            selectPendingFeedbackFeature(state),
    );

    return (
        <Column>
            {pendingFeedbackFeature && (
                <ElevationContext baseElevation={0}>
                    <Box padding={16}>
                        <FeedbackFormManager />
                    </Box>
                </ElevationContext>
            )}

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
};
