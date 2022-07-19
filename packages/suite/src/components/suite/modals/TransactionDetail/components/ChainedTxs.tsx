import React from 'react';
import styled from 'styled-components';
import TrezorLink from '@suite-components/TrezorLink';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import TransactionItem from '@wallet-components/TransactionItem';

const Wrapper = styled.div`
    text-align: left;
    margin-top: 25px;
`;

const StyledTrezorLink = styled(TrezorLink)`
    width: 100%;
`;

interface ChainedTxsProps {
    txs: WalletAccountTransaction[];
    explorerUrl: string;
}

export const ChainedTxs = ({ txs, explorerUrl }: ChainedTxsProps) => (
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
