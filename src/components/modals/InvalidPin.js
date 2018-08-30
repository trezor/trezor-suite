/* @flow */


import React from 'react';
import type { Props } from './index';

const InvalidPin = (props: Props) => {
    if (!props.modal.opened) return null;

    const { device } = props.modal;
    return (
        <div className="pin">
            <h3>Entered PIN for { device.label } is not correct</h3>
            <p>Retrying...</p>
        </div>
    );
};

export default InvalidPin;