import React from 'react';
import { Notification, H1 } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../components/Story';

storiesOf('Notifications', module).add(
    'All',
    () => {
        const states = ['success', 'info', 'warning', 'error'];
        type StateType = 'success' | 'info' | 'warning' | 'error';

        return (
            <>
                {states.map(state => (
                    <StoryColumn>
                        <H1>{state}</H1>
                        <Notification
                            title="The main message"
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            mainCta={{
                                onClick: () => {},
                                label: 'CTA',
                            }}
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-cta-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            mainCta={{
                                onClick: () => {},
                                label: 'Main CTA',
                            }}
                            secondCta={{
                                onClick: () => {},
                                label: 'Second CTA',
                            }}
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-second-cta-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            isLoading
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-loading-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            message="Something else that needs to be told. This short message is optional and also not needed."
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-desc-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            message="Something else that needs to be told. This short message is optional and also not needed."
                            mainCta={{
                                onClick: () => {},
                                label: 'CTA',
                            }}
                            state={state as StateType}
                            wrapperProps={{ 'data-test': `notification-desc-cta-${state}` }}
                        />
                        <Notification
                            title="The main message"
                            message="Something else that needs to be told. This short message is optional and also not needed."
                            mainCta={{
                                onClick: () => {},
                                label: 'Main CTA',
                            }}
                            secondCta={{
                                onClick: () => {},
                                label: 'Second CTA',
                            }}
                            state={state as StateType}
                            wrapperProps={{
                                'data-test': `notification-desc-second-cta-${state}`,
                            }}
                        />
                        <Notification
                            title="The main message"
                            message="Something else that needs to be told. This short message is optional and also not needed."
                            isLoading
                            state={state as StateType}
                            wrapperProps={{
                                'data-test': `notification-desc-loading-${state}`,
                            }}
                        />
                    </StoryColumn>
                ))}
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
