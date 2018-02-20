/* @flow */
'use strict';

import React from 'react';

const Confirmation = (props): any => {
    const {
        amount,
        address,
        coin,
        token,
        total,
        selectedFeeLevel
    } = props.sendForm;

    return (
        <div className="confirm-tx">
            <div className="header">
                <h3>Confirm transaction on your TREZOR</h3>
                <p>Details are shown on device</p>
            </div>
            <div className="content">
                <label>Send </label>
                <p>{ `${amount} ${token.toUpperCase() }` }</p>
                <label>To</label>
                <p>{ address }</p>
                <label>Fee</label>
                <p>{ selectedFeeLevel.label }</p>
            </div>
        </div>
    );
}

export default Confirmation;