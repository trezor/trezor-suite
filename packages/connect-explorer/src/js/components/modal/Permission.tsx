import React from 'react';
import { Button } from '@trezor/components';

const Permission = (props): any => {
    const { onPermissionGranted, onPermissionRejected } = props.modalActions;
    return (
        <div className="confirmation">
            <h3>
                <span>HOST</span> is requesting permissions to:
            </h3>
            <div className="permissions_list"></div>
            <Button onClick={onPermissionGranted}>Accept</Button>
            <Button onClick={onPermissionRejected}>Cancel</Button>
        </div>
    );
};

export default Permission;
