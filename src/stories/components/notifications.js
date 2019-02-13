import React from 'react';

import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import { withInfo } from '@storybook/addon-info';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';

import styled from 'styled-components';

import Notification from 'components/Notification';

const Wrapper = styled.div`
    min-width: 600px;
`;
Wrapper.displayName = 'Wrapper';

storiesOf('Notifications', module)
    .addDecorator(
        withInfo({
            header: true,
            propTablesExclude: [Wrapper],
        }),
    )
    .addDecorator(centered)
    .addDecorator(withKnobs)
    .add('Default', () => (
        <Wrapper>
            <Notification
                type={select('Type', {
                    Success: 'success',
                    Warning: 'warning',
                    Info: 'info',
                }, 'success')}
                title={text('Title', 'Notification title')}
                message={text('Text', 'Text of the notification.')}
                cancelable={boolean('Cancelable', false)}
            />
        </Wrapper>
    ))
    .add('CTA', () => (
        <Wrapper>
            <Notification
                type={select('Type', {
                    Success: 'success',
                    Warning: 'warning',
                    Info: 'info',
                }, 'success')}
                title={text('Title', 'Notification title')}
                message={text('Text', 'Text of the notification.')}
                actions={[
                    {
                        label: 'Confirm',
                        callback: () => {},
                    },
                ]}
            />
        </Wrapper>
    ));
