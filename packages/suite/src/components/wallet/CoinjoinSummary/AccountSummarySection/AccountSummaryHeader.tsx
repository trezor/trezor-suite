import React from 'react';
import styled from 'styled-components';
import CloseButton from '@suite-components/CloseButton';
import { H3 } from '@trezor/components';
import { AnonymityIndicator } from './AnonymityIndicator';
import { Translation } from '@suite-components/Translation';

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
`;

const StyledCloseButton = styled(CloseButton)`
    margin-left: 30px;
`;

const RightContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

interface AccountSummaryHeaderProps {
    onClose?: () => void;
}

export const AccountSummaryHeader = ({ onClose }: AccountSummaryHeaderProps) => (
    <Container>
        <H3>
            <Translation id="TR_MY_COINS" />
        </H3>

        <RightContainer>
            <AnonymityIndicator />

            {onClose && <StyledCloseButton onClick={onClose} />}
        </RightContainer>
    </Container>
);
