import React from 'react';
import styled from 'styled-components';

import { goto } from '@suite-actions/routerActions';
import * as coinjoinActions from '@wallet-actions/coinjoinAccountActions';
import * as modalActions from '@suite-actions/modalActions';
import { Account } from '@suite-common/wallet-types';
import { Card, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
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
    account: Account;
}

export const BalanceSection = ({ account }: BalanceSectionProps) => {
    const actions = useActions({
        goto,
        pauseSession: coinjoinActions.pauseCoinjoinSession.bind(null, account),
        restoreSession: coinjoinActions.restoreCoinjoinSession.bind(null, account),
        stopSession: modalActions.openModal.bind(null, { type: 'cancel-coinjoin' }),
    });
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, account.key));
    const { notAnonymized } = useSelector(selectCurrentCoinjoinBalanceBreakdown);

    const allAnonymized = notAnonymized === '0';

    const goToSetup = () => actions.goto('wallet-anonymize', { preserveParams: true });
    const getRightSideComponent = () => {
        if (coinjoinAccount?.session) {
            return (
                <CoinjoinStatus
                    session={coinjoinAccount.session}
                    pauseSession={actions.pauseSession}
                    restoreSession={actions.restoreSession}
                    stopSession={actions.stopSession}
                />
            );
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
