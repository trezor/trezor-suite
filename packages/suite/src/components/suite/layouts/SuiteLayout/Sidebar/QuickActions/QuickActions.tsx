import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

import { Tor } from './Tor';
import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';

const ActionsContainer = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};

    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: 0 ${spacingsPx.xs};
    align-items: stretch;

    > * {
        flex: 1;
    }
`;

type QuickActionsProps = {
    showUpdateBannerNotification: boolean;
};

export const QuickActions = ({ showUpdateBannerNotification }: QuickActionsProps) => (
    <ActionsContainer>
        <UpdateStatusActionBarIcon showUpdateBannerNotification={showUpdateBannerNotification} />
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <HideBalances />
    </ActionsContainer>
);
