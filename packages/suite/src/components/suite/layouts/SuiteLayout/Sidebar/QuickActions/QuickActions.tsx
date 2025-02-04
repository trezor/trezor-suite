import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { Tor } from './Tor';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';
import { useResponsiveContext } from '../../../../../../support/suite/ResponsiveContext';

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
    showUpdateBannerNotification: boolean;
};

export const QuickActions = ({ showUpdateBannerNotification }: QuickActionsProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <ActionsContainer $isSidebarCollapsed={isSidebarCollapsed}>
            <UpdateStatusActionBarIcon
                showUpdateBannerNotification={showUpdateBannerNotification}
            />
            <DebugAndExperimental />
            <CustomBackend />
            <Tor />
            <HideBalances />
        </ActionsContainer>
    );
};
