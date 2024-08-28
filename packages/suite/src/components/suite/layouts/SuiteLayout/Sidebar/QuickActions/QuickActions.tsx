import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

import { Tor } from './Tor';
import { CustomBackend } from './CustomBackend';
import { DebugAndExperimental } from './DebugAndExperimental';
import { HideBalances } from './HideBalances';
// import { Update } from './Update';

const ActionsContainer = styled.div`
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    display: flex;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs};
    align-items: stretch;

    > * {
        flex: 1;
    }
`;

export const QuickActions = () => (
    <ActionsContainer>
        {/* <Update /> */}
        <DebugAndExperimental />
        <CustomBackend />
        <Tor />
        <HideBalances />
    </ActionsContainer>
);
