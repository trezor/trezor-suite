/* @flow */
'use strict';

import React from 'react';
import BigNumber from 'bignumber.js';

const SummaryDetails = (props: any): any => {

    if (!props.summary.details) return (
        <div className="summary-details">
            <div className="toggle" onClick={ props.onToggle }></div>
        </div>
    );

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === props.coin);
    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    let balanceColumn = null;
    let rateColumn = null;

    if (fiatRate) {

        const accountBalance = new BigNumber(props.balance);
        const fiatValue = new BigNumber(fiatRate.value);
        const fiat = accountBalance.times(fiatValue).toFixed(2);

        balanceColumn = (
            <div className="column">
                <div className="label">Balance</div>
                <div className="fiat-value">${ fiat }</div>
                <div className="value">{ props.balance } { selectedCoin.symbol }</div>
            </div>
        );

        rateColumn = (
            <div className="column">
                <div className="label">Rate</div>
                <div className="fiat-value">${ fiatValue.toFixed(2) }</div>
                <div className="value">1.00 { selectedCoin.symbol }</div>
            </div>
        )
    } else {
        balanceColumn = (
            <div className="column">
                <div className="label">Balance</div>
                <div className="fiat-value">{ props.balance } { selectedCoin.symbol }</div>
            </div>
        );
    }
    
    return (
        <div className="summary-details opened">
            <div className="toggle" onClick={ props.onToggle }></div>
            <div className="content">
                { balanceColumn }
                { rateColumn }
            </div>
        </div>
    );
}

export default SummaryDetails;