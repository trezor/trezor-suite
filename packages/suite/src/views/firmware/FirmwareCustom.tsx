import React from 'react';
import * as routerActions from '@suite-actions/routerActions';
import { useActions } from '@suite-hooks';
import { Modal } from '@suite-components';

const FirmwareCustom = () => {
    const { closeModalApp } = useActions({
        closeModalApp: routerActions.closeModalApp,
    });

    const onCancel = () => {
        closeModalApp();
    };

    return <Modal cancelable onCancel={onCancel} />;
};

export default FirmwareCustom;
