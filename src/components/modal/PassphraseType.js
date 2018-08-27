/* @flow */


import React from 'react';
import type { Props } from './index';

const Confirmation = (props: Props) => {
    if (!props.modal.opened) return null;
    const { device } = props.modal;

    return (
        <div className="confirm-tx">
            <div className="header">
                <h3>Complete the action on { device.label } device</h3>
            </div>
        </div>
    );
};

export default Confirmation;