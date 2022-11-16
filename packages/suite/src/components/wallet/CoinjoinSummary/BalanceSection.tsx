import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

import { goto } from '@suite-actions/routerActions';
import { Card, Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { Button, variables } from '@trezor/components';
import {
    selectCoinjoinAccountByKey,
    selectCurrentCoinjoinBalanceBreakdown,
} from '@wallet-reducers/coinjoinReducer';
import { BalancePrivacyBreakdown } from './BalancePrivacyBreakdown';
import { CoinjoinStatus } from './CoinjoinStatus';

const Container = styled(Card)`
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    margin-bottom: 10px;
`;

const AnonymizeButton = styled(Button)`
    justify-content: space-between;
    width: 154px;
    height: 46px;
    padding: 9px 18px;
`;

const Message = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface BalanceSectionProps {
    accountKey: string;
}

export const BalanceSection = ({ accountKey }: BalanceSectionProps) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);

    const dispatch = useDispatch();

    const allAnonymized = notAnonymized === '0';

    const goToSetup = () => dispatch(goto('wallet-anonymize', { preserveParams: true }));

    const getRightSideComponent = () => {
        if (coinjoinAccount?.session) {
            return <CoinjoinStatus session={coinjoinAccount.session} accountKey={accountKey} />;
        }

        if (allAnonymized) {
            return (
                <Message>
                    <Translation id="TR_NOTHING_TO_ANONYMIZE" />
                </Message>
            );
        }

        return (
            <AnonymizeButton
                onClick={goToSetup}
                icon="ARROW_RIGHT_LONG"
                alignIcon="right"
                size={16}
            >
                <Translation id="TR_ANONYMIZE" />
            </AnonymizeButton>
        );
    };

    return (
        <Container>
            <BalancePrivacyBreakdown />
            {getRightSideComponent()}
        </Container>
    );
};
