/* @flow */
import { Notification } from 'components/Notification';

import type { Props } from '../../index';

export default (props: Props) => {
    const { location } = props.router;
    if (!location) return null;

    const notifications: Array<Notification> = [];
    // if (location.state.device) {
    //     notifications.push(<Notification key="example" type="info" title="Static example" />);
    // }

    return notifications;
};