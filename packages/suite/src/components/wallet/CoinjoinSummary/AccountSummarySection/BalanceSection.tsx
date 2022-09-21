import React from 'react';
import styled from 'styled-components';

import * as routerActions from '@suite-actions/routerActions';
import { Account } from '@suite-common/wallet-types';
import { Card, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { Button } from '@trezor/components';
import { CoinjoinSessionStatus } from '../CoinjoinSessionStatus';
import { FundsPrivacyBreakdown } from './FundsPrivacyBreakdown';

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
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { coinjoin } = useSelector(state => state.wallet);

    const session = coinjoin.accounts.find(a => a.key === account.key)?.session;

    const goToSetup = () => goto('wallet-anonymize', { preserveParams: true });

    return (
        <>
            {/* temporary - content will be reworked and moved into the container below */}
            {session && (
                <Container>
                    <CoinjoinSessionStatus account={account} session={session} />
                </Container>
            )}

            <Container>
                <FundsPrivacyBreakdown />
                {session ? (
                    <Translation id="TR_ANONYMIZING" />
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
        </>
    );
};
