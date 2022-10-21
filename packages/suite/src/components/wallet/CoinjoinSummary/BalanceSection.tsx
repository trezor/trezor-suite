import React from 'react';
import styled from 'styled-components';

import { goto } from '@suite-actions/routerActions';
import { Account, CoinjoinSession } from '@suite-common/wallet-types';
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

// temporary for easy testing
// @ts-expect-error
const mockSession: CoinjoinSession = {
    maxRounds: 10,
    signedRounds: ['1', '1', '1'],
    timeCreated: 1203040234,
    deadline: 1234712054,
    targetAnonymity: 1,
    maxFeePerKvbyte: 2,
    maxCoordinatorFeeRate: 3,
};

interface BalanceSectionProps {
    account: Account;
}

export const BalanceSection = ({ account }: BalanceSectionProps) => {
    const actions = useActions({
        goto,
    });
    const { coinjoin } = useSelector(state => state.wallet);

    const session = coinjoin.accounts.find(a => a.key === account.key)?.session;

    const goToSetup = () => actions.goto('wallet-anonymize', { preserveParams: true });

    return (
        <Container>
            <BalancePrivacyBreakdown />

            {session ? (
                <CoinjoinStatus session={session} />
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
