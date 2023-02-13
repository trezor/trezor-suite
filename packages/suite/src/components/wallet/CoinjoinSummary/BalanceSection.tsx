import React from 'react';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import {
    selectCoinjoinAccountByKey,
    selectHasAnonymitySetError,
} from '@wallet-reducers/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown';
import { BalanceError } from './BalanceError';
import { CoinjoinStatusWheel } from './CoinjoinStatusWheel';

export const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 150px;
    align-items: center;
`;

interface BalanceSectionProps {
    accountKey: string;
}

export const BalanceSection = ({ accountKey }: BalanceSectionProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));
    const hasAnonymitySetError = useSelector(selectHasAnonymitySetError);

    return (
        <Container>
            {hasAnonymitySetError ? <BalanceError /> : <BalancePrivacyBreakdown />}

            <CoinjoinStatusWheel session={coinjoinAccount?.session} accountKey={accountKey} />
        </Container>
    );
};
