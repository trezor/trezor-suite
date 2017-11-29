/* @flow */
'use strict';

import React from 'react';

const Permission = (props): any => {
    const { onPermissionGranted, onPermissionRejected } = props.modalActions;
    return (
        <div className="confirmation">
            <h3><span>HOST</span> is requesting permissions to:</h3>
            <div className="permissions_list"></div>
            <button onClick={ onPermissionGranted }>Accept</button>
            <button onClick={ onPermissionRejected }>Cancel</button>
        </div>
    );
}

export default Permission;