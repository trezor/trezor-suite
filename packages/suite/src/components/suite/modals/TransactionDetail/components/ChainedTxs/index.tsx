import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import TransactionItem from '@wallet-components/TransactionItem';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

interface Props {
    txs: WalletAccountTransaction[];
}

const ChainedTxs = ({ txs }: Props) => (
    <Wrapper>
        {txs.map(tx => (
            <TransactionItem
                key={tx.txid}
                transaction={tx}
                isPending
                isActionDisabled
                accountKey={`${tx.descriptor}-${tx.symbol}-${tx.deviceState}`}
            />
        ))}
    </Wrapper>
);

export default ChainedTxs;
