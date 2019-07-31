import React from 'react';
import { H1, H5, Notification } from '@trezor/components';
import styled from 'styled-components/native';

const Wrapper = styled.View`
    padding: 10px;
`;

const Col = styled.View`
    flex-direction: column;
`;

const Notifications = () => {
    const notMessage =
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Etiam sapien elit.';

    return (
        <Wrapper>
            <H1>Basic</H1>
            <Col>
                <Notification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_info"
                />
                <Notification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_success"
                />
                <Notification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_warning"
                />
                <Notification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    data-test="notification_basic_error"
                />
            </Col>
            <Col />

            <H5>cancellable </H5>
            <Col>
                <Notification
                    variant="info"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_info"
                />
                <Notification
                    variant="success"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_success"
                />
                <Notification
                    variant="warning"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_warning"
                />
                <Notification
                    variant="error"
                    title="Notification title"
                    message={notMessage}
                    cancelable
                    data-test="notification_cancelable_error"
                />
            </Col>
            <H5>with an action button</H5>
            <Col>
                <Notification
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
                <Notification
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
                <Notification
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
                <Notification
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
            </Col>

            <H5>with an action in progress</H5>
            <Col>
                <Notification
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
                <Notification
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
                <Notification
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
                <Notification
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
            </Col>
        </Wrapper>
    );
};

export default Notifications;
