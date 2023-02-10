import React from 'react';
import styled from 'styled-components';
import { useDispatch } from '@suite-hooks';
import { Button } from '@trezor/components';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Translation } from '@suite-components/Translation';
import { goto } from '@suite-actions/routerActions';
import { useSelector } from '@suite-hooks/useSelector';
import { Container } from './BalanceSection';
import { SummaryMessage } from './SummaryMessage';

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
            <SummaryMessage
                headingId="TR_EMPTY_ACCOUNT_TITLE"
                messageId="TR_EMPTY_COINJOIN_ACCOUNT_SUBTITLE"
            />

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
