/* @flow */


import React from 'react';
import type { Props } from './index';

const Confirmation = (props: Props) => {
    if (!props.modal.opened) return null;
    const { device } = props.modal;

    const {
        amount,
        address,
        currency,
        total,
        selectedFeeLevel,
    } = props.sendForm;

    return (
        <div className="confirm-tx">
            <div className="header">
                <h3>Confirm transaction on { device.label } device</h3>
                <p>Details are shown on display</p>
            </div>
            <div className="content">
                <label>Send </label>
                <p>{ `${amount} ${currency}` }</p>
                <label>To</label>
                <p>{ address }</p>
                <label>Fee</label>
                <p>{ selectedFeeLevel.label }</p>
            </div>
        </div>
    );
};

export default Confirmation;