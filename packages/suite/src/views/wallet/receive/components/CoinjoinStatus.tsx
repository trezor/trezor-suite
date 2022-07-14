import React from 'react';
import styled from 'styled-components';
import { Switch, Button } from '@trezor/components';
import { Card } from '@suite-components';
import { Row } from '@suite-components/Settings';
import { useActions, useSelector } from '@suite-hooks';
import * as coinjoinActions from '@wallet-actions/coinjoinAccountActions';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 12px;
`;

const StyledRow = styled(Row)`
    display: flex;
    padding-top: 0;
    flex-direction: row;
`;

export const Status = () => {
    const actions = useActions({
        startCoinjoinSession: coinjoinActions.startCoinjoinSession,
        stopCoinjoinSession: coinjoinActions.stopCoinjoinSession,
    });
    const { coinjoin, selectedAccount } = useSelector(s => ({
        selectedAccount: s.wallet.selectedAccount,
        coinjoin: s.wallet.coinjoin,
    }));
    const { account } = selectedAccount;
    if (!account) return null;

    const activeSessions = coinjoin.accounts.filter(a => a.session);
    const coinjoinAccount = coinjoin.accounts.find(a => a.key === account.key);
    const isRegisteredAnotherAccount = !coinjoinAccount?.session && activeSessions.length > 0;

    const toggleCoinJoin = () => {
        if (!coinjoinAccount?.session) {
            actions.startCoinjoinSession(account, {
                maxRounds: 3,
                maxFeePerKvbyte: 200000,
                anonymityLevel: 1,
                maxCoordinatorFeeRate: 3000000,
            });
        } else {
            actions.stopCoinjoinSession(account);
        }
    };

    if (isRegisteredAnotherAccount || !isRegisteredAnotherAccount) return null;

    return (
        <StyledCard largePadding>
            <StyledRow>
                CoinJoin status
                {isRegisteredAnotherAccount ? (
                    <Button>Is already running on different account</Button>
                ) : (
                    <Switch
                        onChange={toggleCoinJoin}
                        isChecked={!!coinjoinAccount?.session}
                        data-test="@wallet/coinjoin/enable"
                    />
                )}
            </StyledRow>
        </StyledCard>
    );
};

export default Status;
