/* @flow */
'use strict';

import React from 'react';

const coins = [
    { symbol: 'btc', label: 'Bitcoin' },
    { symbol: 'bch', label: 'Bitcoin Cash' },
    { symbol: 'btg', label: 'Bitcoin Gold' },
    { symbol: 'ltc', label: 'Litecoin' },
    { symbol: 'dash', label: 'Dash' },
    { symbol: 'zcash', label: 'Zcash' },
    { symbol: 'test', label: 'Testnet' },
    { symbol: 'doge', label: 'Dogecoin' },
    { symbol: 'vtc', label: 'Vertcoin' },
]

const CoinSelect = (props): any => {

    const coinz = [ ...coins ];
    if (!props.obligatory) {
        coinz.unshift( { symbol: '', label: 'Select coin'} );
    }
    const options = coinz.map(c => {
        return (
            <option key={ c.symbol } value={ c.symbol }>{ c.label }</option>
        )
    })
    return (
        <div className="row" >
            <label>Coin:</label>
            <select value={ props.coin } onChange={ event => props.onCoinChange(event.target.value) }>
                { options }
            </select>
        </div>
    );
}

export default CoinSelect;