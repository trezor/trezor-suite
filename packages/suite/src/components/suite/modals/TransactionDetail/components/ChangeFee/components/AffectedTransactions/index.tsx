import React from 'react';
import styled from 'styled-components';
import { Icon, Button, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { useRbfContext } from '@wallet-hooks/useRbfForm';

const Wrapper = styled.div`
    display: block;
    text-align: left;
    background-color: red;
    border-radius: 6px;
`;

const Inner = styled.div`
    display: flex;
`;

const Amount = styled.div`
    display: flex;
`;

const AffectedTransactions = ({ showChained }: { showChained: () => void }) => {
    const theme = useTheme();
    const { network, chainedTxs } = useRbfContext();
    if (!chainedTxs) return null;

    return (
        <Wrapper>
            <div>
                <Translation id="TR_AFFECTED_TXS" />
                <Button variant="tertiary" onClick={showChained}>
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            </div>

            {chainedTxs.map(tx => (
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
