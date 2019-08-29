import React from 'react';

import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { H1, H5, Notification } from '@trezor/components';
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

const notMessage = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam sapien elit.';

storiesOf('Notifications', module).add(
    'All',
    () => (
        <Wrapper>
            <H1>Basic</H1>
            <Row>
                <StyledNotification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_info"
                />
                <StyledNotification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_success"
                />
                <StyledNotification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_warning"
                />
                <StyledNotification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_error"
                />
            </Row>
            <Row />

            <H5>cancellable </H5>
            <Row>
                <StyledNotification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_info"
                />
                <StyledNotification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_success"
                />
                <StyledNotification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_warning"
                />
                <StyledNotification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_error"
                />
            </Row>
            <H5>with an action button</H5>
            <Row>
                <StyledNotification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_info"
                />
                <StyledNotification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_success"
                />
                <StyledNotification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_warning"
                />
                <StyledNotification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_error"
                />
            </Row>

            <H5>with an action in progress</H5>
            <Row>
                <StyledNotification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    isActionInProgress
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_loading_info"
                />
                <StyledNotification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    isActionInProgress
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_loading_success"
                />
                <StyledNotification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    isActionInProgress
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_loading_warning"
                />
                <StyledNotification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    isActionInProgress
                    actions={[
                        {
                            label: 'Call To Action',
                            callback: () => {},
                        },
                    ]}
                    data-test="notification_cancelable_action_loading_error"
                />
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
            const title = text('Title', 'Notification title');
            const message = text('Text', 'Text of the notification.');
            const cancelable = boolean('Cancelable', false);

            if (cancelable) {
                return (
                    <Notification variant={variant} title={title} message={message} cancelable />
                );
            }
            return <Notification variant={variant} title={title} message={message} />;
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
