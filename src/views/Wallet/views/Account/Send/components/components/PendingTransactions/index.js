/* @flow */
import React from 'react';
import styled from 'styled-components';
import { colors, H5 } from 'trezor-ui-components';
import Transaction from 'components/Transaction';

import type { Network } from 'reducers/LocalStorageReducer';
import type { BaseProps } from '../../../index';
// import testData from './test.data';

type Props = {
    pending: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'pending'>,
    network: Network,
};

const Wrapper = styled.div`
    padding-top: 20px;
    border-top: 1px solid ${colors.DIVIDER};
`;

const PendingTransactions = (props: Props) => {
    // const pending = props.pending.filter(tx => !tx.rejected).concat(testData);
    const pending = props.pending.filter(tx => !tx.rejected);

    return (
        <Wrapper>
            <H5>Pending transactions</H5>
            {pending.map(tx => (
                <Transaction key={tx.hash} network={props.network} tx={tx} />
            ))}
        </Wrapper>
    );
};

export default PendingTransactions;
