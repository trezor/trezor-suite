/* @flow */
'use strict';

import React from 'react';

const InvalidPin = (props): any => {
    const { device } = props.modal;
    return (
        <div className="pin">
            <h3>Entered PIN for { device.label } is not correct.</h3>
            <p>Retrying...</p>
        </div>
    );
}

export default InvalidPin;