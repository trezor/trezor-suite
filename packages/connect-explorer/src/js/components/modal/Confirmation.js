/* @flow */
'use strict';

import React from 'react';

const Confirmation = (props): any => {
    const { onConfirmation, onConfirmationCancel } = props.modalActions;
    return (
        <div className="confirmation">
            <h3>Confirm</h3>
            <button onClick={ onConfirmation }>Export</button>
            <button onClick={ onConfirmationCancel }>Cancel</button>
        </div>
    );
}

export default Confirmation;