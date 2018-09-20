/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import ColorHash from 'color-hash';
import { H2 } from 'components/Heading';
import Link from 'components/Link';
import ScaleText from 'react-scale-text';

import type { Coin } from 'reducers/LocalStorageReducer';
import type { Token } from 'reducers/TokensReducer';
import type { Props as BaseProps } from '../../Container';

type Props = {
    pending: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'pending'>,
    tokens: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'tokens'>,
    network: Coin
}

const Wrapper = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
`;

const TransactionWrapper = styled.div`
    border-bottom: 1px solid ${colors.DIVIDER};
    padding: 14px 48px;
    display: flex;
    flex-direction: row;
    align-items: center;

    &:last-child {
        border-bottom: 0px;
    }
`;

const TransactionIcon = styled.div`
    padding: 6px;
    margin-right: 10px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    line-height: 30px;
    text-transform: uppercase;
    user-select: none;
    text-align: center;
    color: ${props => props.color};
    background: ${props => props.background};
    border-color: ${props => props.borderColor};
`;

const P = styled.p``;

const TransactionName = styled.div`
    flex: 1;
`;

const TransactionAmount = styled.div``;

class PendingTransactions extends Component<Props> {
    getPendingTransactions() {
        return this.props.pending.filter(tx => !tx.rejected);
    }

    getTransactionIconColors(tx: any) {
        let iconColors = { };
        const bgColorFactory = new ColorHash({ lightness: 0.7 });
        const textColorFactory = new ColorHash();

        const isSmartContractTx = tx.currency !== this.props.network.symbol;

        if (isSmartContractTx) {
            const token: ?Token = this.findTransactionToken(tx.currency);

            if (!token) {
                iconColors = {
                    color: '#ffffff',
                    background: '#000000',
                    borderColor: '#000000',
                };
            } else {
                const bgColor: string = bgColorFactory.hex(token.name);
                iconColors = {
                    color: textColorFactory.hex(token.name),
                    background: bgColor,
                    borderColor: bgColor,
                };
            }
        } else {
            iconColors = {
                color: textColorFactory.hex(tx.network),
                background: bgColorFactory.hex(tx.network),
                borderColor: bgColorFactory.hex(tx.network),
            };
        }

        return iconColors;
    }

    getTransactionSymbol(tx: any) {
        let { symbol } = this.props.network;
        const isSmartContractTx = tx.currency !== this.props.network.symbol;
        if (isSmartContractTx) {
            const token: ?Token = this.findTransactionToken(tx.currency);
            symbol = token ? token.symbol.toUpperCase() : 'Unknown';
        }
        return symbol;
    }

    getTransactionName(tx: any) {
        let { name } = this.props.network;
        const isSmartContractTx = tx.currency !== this.props.network.symbol;
        if (isSmartContractTx) {
            const token: ?Token = this.findTransactionToken(tx.currency);
            name = token ? token.symbol.toUpperCase() : 'Unknown';
        }
        return name;
    }

    findTransactionToken(transactionCurrency: string) {
        return this.props.tokens.find(t => t.symbol === transactionCurrency);
    }

    render() {
        return (
            <Wrapper>
                <H2>Pending transactions</H2>
                {this.getPendingTransactions().map(tx => (
                    <TransactionWrapper
                        key={tx.id}
                    >
                        <TransactionIcon
                            color={() => this.getTransactionIconColors(tx).color}
                            background={() => this.getTransactionIconColors(tx).background}
                            borderColor={() => this.getTransactionIconColors(tx).borderColor}
                        >
                            <ScaleText widthOnly>
                                <P>{this.getTransactionSymbol(tx)}</P>
                            </ScaleText>
                        </TransactionIcon>

                        <TransactionName>
                            <Link
                                href={`${this.props.network.explorer.tx}${tx.id}`}
                                target="_blank"
                                rel="noreferrer noopener"
                            >
                                {this.getTransactionName(tx)}
                            </Link>
                        </TransactionName>

                        <TransactionAmount>
                            {tx.currency !== this.props.network.symbol ? tx.amount : tx.total} {this.getTransactionSymbol(tx)}
                        </TransactionAmount>
                    </TransactionWrapper>
                ))}
            </Wrapper>
        );
    }
}

export default PendingTransactions;
