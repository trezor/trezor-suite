/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { selectedDevice } = props.wallet;
    const outdated = selectedDevice && selectedDevice.features && selectedDevice.firmware === 'outdated';
    if (!outdated) return null;
    return (
        <Notification
            type="warning"
            title="Firmware update"
            actions={
                [{
                    label: 'Read more',
                    callback: async () => {
                        
                    },
                }]
            }
        />
    );
};