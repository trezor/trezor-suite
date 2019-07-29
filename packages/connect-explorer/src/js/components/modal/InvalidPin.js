/* @flow */
'use strict';

import React from 'react';

const InvalidPin = (props): any => {
    return (
        <div className="invalid_pin">
            <h3>Entered PIN is not correct. Retrying...</h3>
        </div>
    );
}

export default InvalidPin;