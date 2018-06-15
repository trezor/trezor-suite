/* @flow */
'use strict';

import React from 'react';

const CoinSelect = (props): any => {
    return (
        <div className="row" >
            <label>Coin:</label>
            <select value={ props.coin } onChange={ event => props.onCoinChange(event.target.value) }>
                <option value="">Select coin</option>
                <option value="btc">Bitcoin</option>
                <option value="bch">Bitcoin Cash</option>
                <option value="btg">Bitcoin Gold</option>
                <option value="ltc">Litecoin</option>
                <option value="dash">Dash</option>
                <option value="zcash">Zcash</option>
                <option value="test">Testnet</option>
                <option value="doge">Dogecoin</option>
                <option value="nmc">Namecoin</option>
            </select>
        </div>
    );
}

export default CoinSelect;