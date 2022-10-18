import React from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { Account } from '@wallet-types';
import { Button, Card, H2, Image, P, variables } from '@trezor/components';
import { getCoinjoinConfig } from '@suite/services/coinjoin/config';
import { Translation } from '@suite-components/Translation';
import { goto } from '@suite-actions/routerActions';

const Container = styled(Card)`
    align-items: center;
    text-align: center;
    padding: 40px 120px;
`;

const Heading = styled(H2)`
    margin: 36px auto 18px;
`;

const AccountDescription = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const FeeText = styled(P)`
    margin-bottom: 22px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

interface CoinjoinAccountEmptyProps {
    account: Account;
}

export const CoinjoinAccountEmpty = ({ account }: CoinjoinAccountEmptyProps) => {
    const { percentageFee } = getCoinjoinConfig(account.symbol);

    const dispatch = useDispatch();

    return (
        <Container>
            <Image image="COINJOIN_MESS" width={300} />

            <Heading>
                <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_TITLE" />
            </Heading>

            <AccountDescription>
                <Translation id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_DESCRIPTION" />
            </AccountDescription>

            <FeeText>
                <Translation
                    id="TR_COINJOIN_ACCESS_ACCOUNT_STEP_INITIAL_FEE_MESSAGE"
                    values={{ fee: percentageFee }}
                />
            </FeeText>

            <Button onClick={() => dispatch(goto('wallet-receive', { preserveParams: true }))}>
                <Translation
                    id="TR_RECEIVE_NETWORK"
                    values={{ network: account.symbol.toUpperCase() }}
                />
            </Button>
        </Container>
    );
};
