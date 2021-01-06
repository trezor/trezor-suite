import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme } from '@trezor/components';
import { useRbfContext } from '@wallet-hooks/useRbfForm';

const Wrapper = styled.div`
    display: block;
    text-align: left;
`;

const Inner = styled.div`
    display: flex;
`;

const Amount = styled.div`
    display: flex;
`;

const AffectedTransactions = () => {
    const theme = useTheme();
    const { network, chainedTxs } = useRbfContext();
    if (!chainedTxs) return null;

    return (
        <Wrapper>
            <div>This operation will remove following transactions from the mempool:</div>
            {chainedTxs.txs.map(tx => (
                <Inner key={tx.txid}>
                    <Icon
                        size={18}
                        color={theme.TYPE_LIGHT_GREY}
                        icon={tx.type === 'recv' ? 'RECEIVE' : 'SEND'}
                    />
                    {tx.txid}
                    <Amount>
                        {tx.amount} {network.symbol}
                    </Amount>
                </Inner>
            ))}
        </Wrapper>
    );
};

export default AffectedTransactions;
