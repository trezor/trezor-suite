import React from 'react';
import { onReceiveConfirmation } from '@suite-actions/modalActions';
import { goto } from '@suite-actions/routerActions';
import { MODAL } from '@suite-actions/constants';
import { useActions } from '@suite-hooks';
import { ConfirmNoBackup } from '@suite-components/modals';

import type { ReduxModalProps } from './types';

/** Modals requested from `trezor-connect` */
export const DeviceConfirmationModal = ({
    windowType,
    renderer,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE_CONFIRMATION>) => {
    const actions = useActions({
        onReceiveConfirmation,
        goto,
    });

    switch (windowType) {
        case 'no-backup':
            return (
                <ConfirmNoBackup
                    onReceiveConfirmation={actions.onReceiveConfirmation}
                    onCreateBackup={() => actions.goto('settings-device')}
                    renderer={renderer}
                />
            );
        default:
            return null;
    }
};
