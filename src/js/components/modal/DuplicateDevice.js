/* @flow */
'use strict';

import React from 'react';

const RememberDevice = (props: any): any => {
    const { device } = props.modal;
    const { onCancel, onDuplicateDevice } = props.modalActions;
    return (
        <div className="duplicate">
            <h3>Clone { device.instanceLabel }?</h3>
            <p>This will create new instance of device which can be used with different passphrase</p>
            <button onClick={ event => onDuplicateDevice( { ...device, instanceLabel: "TODO: user label from input" } ) }>Create new instance</button>
            <button className="white" onClick={ onCancel }>Cancel</button>
        </div>
    );
}

export default RememberDevice;