import React from 'react';

import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import { withInfo } from '@storybook/addon-info';
import styled from 'styled-components';

import Notification from 'components/Notification';

const Wrapper = styled.div`
    min-width: 600px;
`;

storiesOf('Notifications', module)
    .addDecorator(centered)
    .addDecorator(
        withInfo({
            header: true,
            propTablesExclude: [Wrapper]
        }),
    )
    .add('Success', () => (
        <Wrapper>
            <Notification
                type="success"
                title="Success notification"
                message="This is a success message"
                cancelable
            />
        </Wrapper>
    ))
    .add('Warning', () => (
        <Wrapper>
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
        </Wrapper>
    ))
    .add('Error', () => (
        <Wrapper>
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
        </Wrapper>
    ));
