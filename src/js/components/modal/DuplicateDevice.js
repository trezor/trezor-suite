/* @flow */
'use strict';

import React from 'react';

const RememberDevice = (props: any): any => {
    const { device } = props.modal;
    const { onCancel, onDuplicateDevice } = props.modalActions;
    return (
        <div className="pin">
            <h3>Duplicate { device.label } ?</h3>

            <label>Device label</label>
            <input type="text" />
            <button onClick={ onCancel }>Cancel</button>
            <button onClick={ event => onDuplicateDevice( { ...device, instanceLabel: "kokot" } ) }>Duplicate</button>
        </div>
    );
}

export default RememberDevice;