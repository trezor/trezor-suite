import React from 'react';

import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';

import styled from 'styled-components';

import Notification from 'components/Notification';
import colors from 'config/colors';

const Wrapper = styled.div`
    min-width: 600px;
`;
Wrapper.displayName = 'Wrapper';

storiesOf('Components', module)
    .addDecorator(
        withInfo({
            header: false,
            inline: true,
            maxPropsIntoLine: 1,
            styles: {
                infoStory: {
                    background: colors.LANDING,
                    borderBottom: `1px solid ${colors.DIVIDER}`,
                    padding: '30px',
                    margin: '-8px',
                },
                infoBody: {
                    border: 'none',
                    padding: '15px',
                },
            },
        }),
    )
    .addDecorator(withKnobs)
    .add('Notification', () => {
        const type = select('Type', {
            Success: 'success',
            Warning: 'warning',
            Info: 'info',
        }, 'success');
        const title = text('Title', 'Notification title');
        const message = text('Text', 'Text of the notification.');
        const cancelable = boolean('Cancelable', false);

        if (cancelable) {
            return (
                <Notification
                    type={type}
                    title={title}
                    message={message}
                    cancelable
                />
            );
        }
        return (
            <Notification
                type={type}
                title={title}
                message={message}
            />
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { Notification } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Notification with CTA', () => (
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
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Notification } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
