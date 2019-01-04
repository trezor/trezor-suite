/* @flow */
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import colors from 'config/colors';
import Link from 'components/Link';

import type { Transaction, Network } from 'flowtype';

type Props = {
    tx: Transaction,
    network: Network,
};

const Wrapper = styled.div`
    border-bottom: 1px solid ${colors.DIVIDER};
    padding: 14px 0;
    display: flex;
    flex-direction: row;

    &:last-child {
        border-bottom: 0px;
    }
`;

const Addresses = styled.div`
    flex: 1;
`;

const Address = styled.div`
    word-break: break-all;
    padding: 2px 0px;
    &:first-child {
        padding-top: 0px;
    }
    &:last-child {
        padding-bottom: 0px;
    }
`;

const Date = styled(Link)`
    font-size: 12px;
    line-height: 18px;
    padding-right: 8px;
    border-bottom: 0px;
`;

const Value = styled.div`
    padding-left: 8px;
    white-space: nowrap;
    text-align: right;
    color: ${colors.GREEN_SECONDARY};

    &.send {
        color: ${colors.ERROR_PRIMARY};
    }
`;

const Amount = styled.div`
    border: 1px;
`;

const Fee = styled.div`
    border: 1px;
`;

const TransactionItem = ({
    tx,
    network,
}: Props) => {
    const url = `${network.explorer.tx}${tx.hash}`;
    const date = typeof tx.timestamp === 'string' ? tx.timestamp : undefined; // TODO: format date
    const addresses = (tx.type === 'send' ? tx.outputs : tx.inputs).reduce((arr, item) => arr.concat(item.addresses), []);

    const operation = tx.type === 'send' ? '-' : '+';
    const amount = tx.tokens ? tx.tokens.map(t => (<Amount key={t.value}>{operation}{t.value} {t.shortcut}</Amount>)) : <Amount>{operation}{tx.total} {network.symbol}</Amount>;
    const fee = tx.tokens && tx.type === 'send' ? `${tx.fee} ${network.symbol}` : undefined;

    return (
        <Wrapper>
            { date && (<Date href={url} isGray>{ date }</Date>)}
            <Addresses>
                { addresses.map(addr => (<Address key={addr}>{addr}</Address>)) }
                { !tx.blockHeight && (
                    <Date href={url} isGray>Transaction hash: {tx.hash}</Date>
                )}
            </Addresses>
            <Value className={tx.type}>
                {amount}
                { fee && (<Fee>{operation}{fee}</Fee>) }
            </Value>
        </Wrapper>
    );
};

TransactionItem.propTypes = {
    tx: PropTypes.object.isRequired,
    network: PropTypes.object.isRequired,
};

export default TransactionItem;