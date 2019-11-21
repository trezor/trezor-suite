import React from 'react';
import styled from 'styled-components';
import { Notification, colors } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    background: ${colors.BLACK96};
    padding: 2rem;
`;

const NotificationWrapper = styled.div`
    margin-bottom: 1rem;
`;

storiesOf('Notifications', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        description="Something else that needs to be told. This short message is optional and also not needed."
                    />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        description="Something else that needs to be told. This short message is optional and also not needed."
                        state="warning"
                    />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        description="Something else that needs to be told. This short message is optional and also not needed."
                        mainCta={{
                            callback: () => {},
                            label: 'CTA',
                        }}
                    />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        description="Something else that needs to be told. This short message is optional and also not needed."
                        mainCta={{
                            callback: () => {},
                            label: 'Main CTA',
                        }}
                        secondCta={{
                            callback: () => {},
                            label: 'Second CTA',
                        }}
                    />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        description="Something else that needs to be told. This short message is optional and also not needed."
                        isLoading
                    />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification title="The main message" isLoading />
                </NotificationWrapper>
                <NotificationWrapper>
                    <Notification
                        title="The main message"
                        mainCta={{
                            callback: () => {},
                            label: 'Main CTA',
                        }}
                        secondCta={{
                            callback: () => {},
                            label: 'Second CTA',
                        }}
                    />
                </NotificationWrapper>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
