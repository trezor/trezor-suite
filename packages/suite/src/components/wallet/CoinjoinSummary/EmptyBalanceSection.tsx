import React from 'react';
import styled from 'styled-components';
import { useDispatch } from '@suite-hooks';
import { Button, variables } from '@trezor/components';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Translation } from '@suite-components/Translation';
import { goto } from '@suite-actions/routerActions';
import { useSelector } from '@suite-hooks/useSelector';
import { Container } from './BalanceSection';

const HeadingCointainer = styled.div`
    margin: -6px 0 0 10px;
`;

const Heading = styled.p`
    margin-bottom: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const SubHeading = styled.p`
    max-width: 300px;
    margin-top: 6px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
`;

const ReceiveButton = styled(Button)`
    height: 46px;
    margin-right: 10px;
    padding: 9px 18px;
`;

interface EmptyBalanceSectionProps {
    accountKey: string;
}

export const EmptyBalanceSection = ({ accountKey }: EmptyBalanceSectionProps) => {
    const account = useSelector(state => selectAccountByKey(state, accountKey));

    const dispatch = useDispatch();

    return (
        <Container>
            <HeadingCointainer>
                <Heading>
                    <Translation id="TR_EMPTY_ACCOUNT_TITLE" />
                </Heading>
                <SubHeading>
                    <Translation id="TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE" />
                </SubHeading>
            </HeadingCointainer>

            <ReceiveButton
                onClick={() => dispatch(goto('wallet-receive', { preserveParams: true }))}
            >
                <Translation
                    id="TR_RECEIVE_NETWORK"
                    values={{ network: account?.symbol.toUpperCase() }}
                />
            </ReceiveButton>
        </Container>
    );
};
