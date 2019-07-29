import React from 'react';
import { Button } from '@trezor/components';

const Confirmation = (props): any => {
    const { onConfirmation, onConfirmationCancel } = props.modalActions;
    return (
        <div className="confirmation">
            <h3>Confirm</h3>
            <Button onClick={onConfirmation}>Export</Button>
            <Button onClick={onConfirmationCancel}>Cancel</Button>
        </div>
    );
};

export default Confirmation;
