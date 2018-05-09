/* @flow */
'use strict';

import React from 'react';
import type { Props } from './index';

const Confirmation = (props: Props) => {
    const {
        amount,
        address,
        network,
        coinSymbol,
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
                <p>{ `${amount} ${ token }` }</p>
                <label>To</label>
                <p>{ address }</p>
                <label>Fee</label>
                <p>{ selectedFeeLevel.label }</p>
            </div>
        </div>
    );
}

export default Confirmation;