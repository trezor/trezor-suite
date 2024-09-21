import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

import { Tor } from './Tor';
import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
import { UpdateStatusActionBarIcon } from './Update/UpdateStatusActionBarIcon';
import { isCollapsedSidebar } from '../consts';

const ActionsContainer = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};

    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    padding: 0 ${spacingsPx.xs};
    align-items: stretch;

    @container ${isCollapsedSidebar} {
        flex-direction: column;
    }

    > * {
        flex: 1;
    }
`;

export const QuickActions = () => (
    <ActionsContainer>
        <UpdateStatusActionBarIcon />
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <HideBalances />
    </ActionsContainer>
);
