/* @flow */
import * as React from 'react';
import { Notification } from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { notifications, close } = props;
    return notifications.map(n => (
        <Notification
            key={n.title}
            type={n.type}
            title={n.title}
            message={n.message}
            cancelable={n.cancelable}
            actions={n.actions}
            close={close}
        />
    ));
};