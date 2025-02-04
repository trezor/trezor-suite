import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';

const ActionsContainer = styled.div<{ $isSidebarCollapsed: boolean }>`
    display: flex;
    gap: ${spacingsPx.xs};

    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: 0 ${spacingsPx.xs};
    align-items: stretch;

    ${({ $isSidebarCollapsed }) => $isSidebarCollapsed && `flex-direction: column;`}

    > * {
        flex: 1;
    }
`;

type QuickActionsProps = {
    isSidebarCollapsed: boolean;
    showUpdateBannerNotification?: boolean;
};

export const QuickActions = ({
    isSidebarCollapsed,
    showUpdateBannerNotification,
}: QuickActionsProps) => (
    <ActionsContainer $isSidebarCollapsed={isSidebarCollapsed}>
        <UpdateStatusActionBarIcon
            showUpdateBannerNotification={Boolean(showUpdateBannerNotification)}
        />
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <HideBalances />
    </ActionsContainer>
);
