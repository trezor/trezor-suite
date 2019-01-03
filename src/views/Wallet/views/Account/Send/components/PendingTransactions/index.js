/* @flow */
import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import { H2 } from 'components/Heading';
import Transaction from 'components/Transaction';


import type { Network } from 'reducers/LocalStorageReducer';
import type { BaseProps } from '../../index';
// import testData from './test.data';

type Props = {
    pending: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'pending'>,
    network: Network
}

const Wrapper = styled.div`
    padding-top: 20px;
    border-top: 1px solid ${colors.DIVIDER};
`;

const PendingTransactions = (props: Props) => {
    // const pending = props.pending.filter(tx => !tx.rejected).concat(testData);
    const pending = props.pending.filter(tx => !tx.rejected);

    return (
        <Wrapper>
            <H2>Pending transactions</H2>
            {pending.map(tx => (
                <Transaction key={tx.hash} network={props.network} tx={tx} />
            ))}
        </Wrapper>
    );
};

export default PendingTransactions;
