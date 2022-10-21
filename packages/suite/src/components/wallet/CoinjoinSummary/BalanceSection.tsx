import React from 'react';
import styled from 'styled-components';

import { goto } from '@suite-actions/routerActions';
import * as coinjoinActions from '@wallet-actions/coinjoinAccountActions';
import * as modalActions from '@suite-actions/modalActions';
import { Account } from '@suite-common/wallet-types';
import { Card, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { Button } from '@trezor/components';
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
    const { coinjoin } = useSelector(state => state.wallet);

    const session = coinjoin.accounts.find(a => a.key === account.key)?.session;

    const goToSetup = () => actions.goto('wallet-anonymize', { preserveParams: true });

    return (
        <Container>
            <BalancePrivacyBreakdown />

            {session ? (
                <CoinjoinStatus
                    session={session}
                    pauseSession={actions.pauseSession}
                    restoreSession={actions.restoreSession}
                    stopSession={actions.stopSession}
                />
            ) : (
                <AnonymizeButton
                    onClick={goToSetup}
                    icon="ARROW_RIGHT_LONG"
                    alignIcon="right"
                    size={16}
                >
                    <Translation id="TR_ANONYMIZE" />
                </AnonymizeButton>
            )}
        </Container>
    );
};
