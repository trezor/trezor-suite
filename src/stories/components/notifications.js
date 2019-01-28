import React from 'react';

import { storiesOf } from '@storybook/react';

import Notification from 'components/Notification';

storiesOf('Notifications', module)
    .addWithJSX('Success', () => (
        <Notification
            type="success"
            title="Success notification"
            message="This is a success message"
            cancelable
        />
    ))
    .addWithJSX('Warning', () => (
        <Notification
            type="warning"
            title="Warning notification"
            message="This is a warning message"
            actions={[
                {
                    label: 'Confirm',
                    callback: () => {},
                },
            ]}
        />
    ))
    .addWithJSX('Error', () => (
        <Notification
            type="error"
            title="Error notification"
            message="This is a error message"
            actions={[
                {
                    label: 'Remove',
                    callback: () => {},
                },
            ]}
        />
    ));
