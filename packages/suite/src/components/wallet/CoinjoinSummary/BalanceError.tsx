import React from 'react';
import styled from 'styled-components';
import { useTheme } from '@trezor/components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCurrentCoinjoinSession } from '@wallet-reducers/coinjoinReducer';
import { BalanceContainer } from './BalancePrivacyBreakdown';
import { SummaryMessage } from './SummaryMessage';

const StyledBalanceContainer = styled(BalanceContainer)`
    padding-left: 10px;
`;

export const BalanceError = () => {
    const currentSession = useSelector(selectCurrentCoinjoinSession);

    const theme = useTheme();

    return (
        <StyledBalanceContainer isSessionRunning={!!currentSession}>
            <SummaryMessage
                headingId="TR_EMPTY_ACCOUNT_TITLE"
                messageId="TR_ANONYMITY_SET_ERROR"
                headingColor={theme.TYPE_RED}
            />
        </StyledBalanceContainer>
    );
};
