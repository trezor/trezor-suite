/* @flow */
'use strict';

import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';

import { findAccountTokens } from '../../../reducers/TokensReducer';

import type { Props as ParentProps } from './index';
import type { Coin } from '../../../reducers/LocalStorageReducer';
import type { Account } from '../../../reducers/AccountsReducer';
import type { Token } from '../../../reducers/TokensReducer';

type Props = ParentProps & {
    account: Account,
    selectedCoin: Coin
}

type Style = {
    +color: string,
    +background: string,
    +borderColor: string
}

const PendingTransactions = (props: Props) => {

    const account = props.account;
    const pending = props.pending.filter(p => p.network === account.network && p.address === account.address);

    if (pending.length < 1) return null;

    const tokens: Array<Token> = findAccountTokens(props.tokens, account);

    const bgColorFactory = new ColorHash({lightness: 0.7});
    const textColorFactory = new ColorHash();

    const pendingTxs = pending.map((tx, i) => {

        let iconColor: Style;
        let symbol: string;
        let name: string;
        const isSmartContractTx: boolean = tx.currency !== props.selectedCoin.symbol;
        if (isSmartContractTx) {
            const token: ?Token = tokens.find(t => t.symbol === tx.currency);
            if (!token) {
                iconColor = {
                    color: '#ffffff',
                    background: '#000000',
                    borderColor: '#000000'
                }
                symbol = "Unknown";
                name = "Unknown";
            } else {
                const bgColor: string = bgColorFactory.hex(token.name);
                iconColor = {
                    color: textColorFactory.hex(token.name),
                    background: bgColor,
                    borderColor: bgColor
                }
                symbol = token.symbol.toUpperCase();
                name = token.name;
            }
        } else {
            iconColor = {
                color: textColorFactory.hex(tx.network),
                background: bgColorFactory.hex(tx.network),
                borderColor: bgColorFactory.hex(tx.network)
            }
            symbol = props.selectedCoin.symbol;
            name = props.selectedCoin.name;
        }

        return (
            <div key={i} className="tx">
                <div className="icon" style={ iconColor }>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">
                    <a href={ `${props.selectedCoin.explorer.tx}${tx.id}`} target="_blank" rel="noreferrer noopener">{ name }</a>
                </div>
                <div className="amount">{ tx.amount } { symbol }</div>
            </div>
        )
    });


    return (
        <div className="pending-transactions">
            <h2>Pending transactions</h2>
            { pendingTxs }
        </div>
    )
}

export default PendingTransactions;