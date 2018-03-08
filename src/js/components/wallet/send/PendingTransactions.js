/* @flow */
'use strict';

import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';

const PendingTransactions = (props: any): any => {

    const account = props.accounts.find(a => a.checksum === props.sendForm.checksum && a.index === props.sendForm.accountIndex && a.coin === props.sendForm.coin);
    const pending = props.pending.filter(p => p.coin === account.coin && p.address === account.address);

    if (pending.length < 1) return null;

    const tokens = props.tokens.filter(t => t.ethAddress === account.address);

    const bgColor = new ColorHash({lightness: 0.7});
    const textColor = new ColorHash();

    const pendings = pending.map((tx, i) => {

        let iconColor, symbol, name;

        if (tx.token !== tx.coin) {
            const token = tokens.find(t => t.symbol === tx.token);
            iconColor = {
                color: textColor.hex(token.name),
                background: bgColor.hex(token.name),
                borderColor: bgColor.hex(token.name)
            }
            symbol = token.symbol.toUpperCase();
            name = token.name;
        } else {
            iconColor = {
                color: textColor.hex(tx.coin),
                background: bgColor.hex(tx.coin),
                borderColor: bgColor.hex(tx.coin)
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
                    <a href={ `${props.selectedCoin.explorer}/tx/${tx.id}`} target="_blank" rel="noreferrer noopener">{ name }</a>
                </div>
                <div className="amount">{ tx.amount } { symbol }</div>
            </div>
        )
    });


    return (
        <div className="pending-transactions">
            <h2>Pending transactions</h2>
            { pendings }
        </div>
    )
}

export default PendingTransactions;