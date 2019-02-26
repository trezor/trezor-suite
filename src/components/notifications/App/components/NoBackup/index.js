/* @flow */
import * as React from 'react';
import Notification from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { selectedDevice } = props.wallet;
    const needsBackup = selectedDevice && selectedDevice.features && selectedDevice.features.needs_backup;
    if (!needsBackup) return null;
    return (
        <Notification
            key="no-backup"
            type="warning"
            title="Your Trezor is not backed up!"
            message="If your device is ever lost or damaged, your funds will be lost. Backup your device first, to protect your coins against such events."
            actions={
                [{
                    label: 'Create a backup',
                    callback: props.routerActions.gotoBackup,
                }]
            }
        />
    );
};