/* @flow */
import * as React from 'react';
import NotificationsGroups from './components/NotificationsGroups';

import type { Props } from '../../index';

export default (props: Props) => {
    const { notifications, close } = props;
    return (
        <NotificationsGroups
            notifications={notifications}
            close={close}
        />
    );
};