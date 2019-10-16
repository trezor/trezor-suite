import React from 'react';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { H2, Notification } from '@trezor/components';
import styled from 'styled-components';
import { infoOptions } from '../../support/info';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const StyledNotification = styled(Notification)``;

const Row = styled.div`
    display: flex;
    margin: 0.5rem 0 2rem;
    flex-wrap: wrap;

    ${StyledNotification} {
        margin: 10px 0px;
    }
`;

Wrapper.displayName = 'Wrapper';

const message = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam sapien elit.';
const notificationTypes = ['info', 'success', 'warning', 'error', undefined] as const;
const variant: any = select(
    'Variant',
    {
        Success: 'success',
        Warning: 'warning',
        Info: 'info',
        Error: 'error',
    },
    'success'
);

storiesOf('Notifications', module).add(
    'All',
    () => (
        <Wrapper>
            <H2>Basic</H2>
            <Row>
                {notificationTypes.map(type => (
                    <StyledNotification
                        variant={type}
                        title="Notification title"
                        message={message}
                        data-test={`notification_basic_${type}`}
                    />
                ))}
            </Row>
            <H2>Cancellable</H2>
            <Row>
                {notificationTypes.map(type => (
                    <StyledNotification
                        variant={type}
                        title="Notification title"
                        message={message}
                        cancelable
                        data-test={`notification_cancelable_${type}`}
                    />
                ))}
            </Row>
            <H2>With an action button</H2>
            <Row>
                {notificationTypes.map(type => (
                    <StyledNotification
                        variant={type}
                        title="Notification title"
                        message={message}
                        cancelable
                        actions={[
                            {
                                label: 'Call To Action',
                                callback: () => {},
                            },
                        ]}
                        data-test={`notification_cancelable_action_${type}`}
                    />
                ))}
            </Row>
            <H2>With an action in progress</H2>
            <Row>
                {notificationTypes.map(type => (
                    <StyledNotification
                        variant={type}
                        title="Notification title"
                        message={message}
                        cancelable
                        isActionInProgress
                        actions={[
                            {
                                label: 'Call To Action',
                                callback: () => {},
                            },
                        ]}
                        data-test={`notification_cancelable_action_loading_${type}`}
                    />
                ))}
            </Row>
        </Wrapper>
    ),
    {
        info: {
            disable: true,
        },
    }
);

storiesOf('Notifications', module)
    .add(
        'Notification',
        () => {
            return (
                <Notification
                    cancelable={boolean('Cancelable', false)}
                    variant={variant}
                    title={text('Title', 'Notification title')}
                    message={text('Text', 'Text of the notification.')}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Notification } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'Notification with CTA',
        () => {
            return (
                <Notification
                    variant={variant}
                    title={text('Title', 'Notification title')}
                    message={text('Text', 'Text of the notification.')}
                    isActionInProgress={boolean('isActionInProgress', false)}
                    cancelable={boolean('Cancelable', false)}
                    actions={[
                        {
                            label: 'Create a backup in 3 minutes',
                            callback: () => {},
                        },
                    ]}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Notification } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    );
