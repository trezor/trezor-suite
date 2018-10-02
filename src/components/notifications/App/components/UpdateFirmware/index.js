/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
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