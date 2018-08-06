/* @flow */


import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';

import { findAccountTokens } from '~/js/reducers/TokensReducer';

import type { Coin } from '~/js/reducers/LocalStorageReducer';
import type { Token } from '~/js/reducers/TokensReducer';
import type { Props as BaseProps } from './index';

type Props = {
    pending: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'pending'>,
    tokens: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'tokens'>,
    network: Coin
}

type Style = {
    +color: string,
    +background: string,
    +borderColor: string
}

const PendingTransactions = (props: Props) => {
    const pending = props.pending.filter(tx => !tx.rejected);
    if (pending.length < 1) return null;

    const tokens: Array<Token> = props.tokens;

    const bgColorFactory = new ColorHash({ lightness: 0.7 });
    const textColorFactory = new ColorHash();

    const pendingTxs: React$Element<string> = pending.map((tx, i) => {
        let iconColor: Style;
        let symbol: string;
        let name: string;
        const isSmartContractTx: boolean = tx.currency !== props.network.symbol;
        if (isSmartContractTx) {
            const token: ?Token = tokens.find(t => t.symbol === tx.currency);
            if (!token) {
                iconColor = {
                    color: '#ffffff',
                    background: '#000000',
                    borderColor: '#000000',
                };
                symbol = 'Unknown';
                name = 'Unknown';
            } else {
                const bgColor: string = bgColorFactory.hex(token.name);
                iconColor = {
                    color: textColorFactory.hex(token.name),
                    background: bgColor,
                    borderColor: bgColor,
                };
                symbol = token.symbol.toUpperCase();
                name = token.name;
            }
        } else {
            iconColor = {
                color: textColorFactory.hex(tx.network),
                background: bgColorFactory.hex(tx.network),
                borderColor: bgColorFactory.hex(tx.network),
            };
            symbol = props.network.symbol;
            name = props.network.name;
        }

        return (
            <div key={i} className="tx">
                <div className="icon" style={iconColor}>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">
                    <a href={`${props.network.explorer.tx}${tx.id}`} target="_blank" rel="noreferrer noopener">{ name }</a>
                </div>
                <div className="amount">{ isSmartContractTx ? tx.amount : tx.total } { symbol }</div>
            </div>
        );
    });


    return (
        <div className="pending-transactions">
            <h2>Pending transactions</h2>
            { pendingTxs }
        </div>
    );
};

export default PendingTransactions;