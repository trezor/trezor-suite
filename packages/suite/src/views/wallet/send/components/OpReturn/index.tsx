import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Card } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
    min-height: 86px;
    padding: 0 42px;
    margin-bottom: 25px;
`;

export default () => {
    const {
        account: { symbol },
        transactionInfo,
    } = useSendFormContext();

    return <StyledCard>op return</StyledCard>;
};
