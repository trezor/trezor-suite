/* @flow */
'use strict';

import React from 'react';

const SummaryDetails = (props: any): any => {

    if (!props.summary.details) {
        return (
            <div className="summary-details closed">
                <div className="toggle" onClick={ props.onToggle }></div>
            </div>
        )
    }

    const fiatValue = "0";
    
    return (
        <div className="summary-details">
            <div className="content">
                <div className="column">
                    <div className="label">Balance</div>
                    <div className="fiat-value">${ fiatValue }</div>
                    <div className="value">{ props.balance } ETH</div>
                </div>
                <div className="column">
                    <div className="label">Rate</div>
                    <div className="fiat-value">${ props.fiatRate }</div>
                    <div className="value">1.00 ETH</div>
                </div>
            </div>
            <div className="toggle" onClick={ props.onToggle }></div>
        </div>
    );
}

export default SummaryDetails;