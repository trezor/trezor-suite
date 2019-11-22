import React from 'react';
import styled from 'styled-components';
import { Notification, H1, colors } from '@trezor/components-v2';
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
        const states = ['success', 'info', 'warning', 'error'];
        type StateType = 'success' | 'info' | 'warning' | 'error';

        return (
            <Wrapper>
                {states.map(state => (
                    <>
                        <H1>{state}</H1>
                        <NotificationWrapper>
                            <Notification
                                title="The main message"
                                state={state as StateType}
                                dataTest={`notification-${state}`}
                            />
                        </NotificationWrapper>
                        <NotificationWrapper>
                            <Notification
                                title="The main message"
                                mainCta={{
                                    callback: () => {},
                                    label: 'CTA',
                                }}
                                state={state as StateType}
                                dataTest={`notification-cta-${state}`}
                            />
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
                                state={state as StateType}
                                dataTest={`notification-second-cta-${state}`}
                            />
                        </NotificationWrapper>
                        <NotificationWrapper>
                            <Notification
                                title="The main message"
                                isLoading
                                state={state as StateType}
                                dataTest={`notification-loading-${state}`}
                            />
                        </NotificationWrapper>
                        <NotificationWrapper>
                            <Notification
                                title="The main message"
                                description="Something else that needs to be told. This short message is optional and also not needed."
                                state={state as StateType}
                                dataTest={`notification-desc-${state}`}
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
                                state={state as StateType}
                                dataTest={`notification-desc-cta-${state}`}
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
                                state={state as StateType}
                                dataTest={`notification-desc-second-cta-${state}`}
                            />
                        </NotificationWrapper>
                        <NotificationWrapper>
                            <Notification
                                title="The main message"
                                description="Something else that needs to be told. This short message is optional and also not needed."
                                isLoading
                                state={state as StateType}
                                dataTest={`notification-desc-loading-${state}`}
                            />
                        </NotificationWrapper>
                    </>
                ))}
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
