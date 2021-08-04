import React from 'react';
import styled from 'styled-components';
import TrezorLink from '@suite-components/TrezorLink';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import TransactionItem from '@wallet-components/TransactionItem';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    width: 100%;
`;

interface Props {
    txs: WalletAccountTransaction[];
    explorerUrl: string;
}

const ChainedTxs = ({ txs, explorerUrl }: Props) => (
    <Wrapper>
        {txs.map(tx => (
            <StyledTrezorLink href={`${explorerUrl}${tx.txid}`} variant="nostyle">
                <TransactionItem
                    key={tx.txid}
                    transaction={tx}
                    isPending
                    isActionDisabled
                    accountKey={`${tx.descriptor}-${tx.symbol}-${tx.deviceState}`}
                />
            </StyledTrezorLink>
        ))}
    </Wrapper>
);

export default ChainedTxs;
