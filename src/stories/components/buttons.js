import React from 'react';
import Button from 'components/buttons/Button';
import WebUSB from 'components/buttons/WebUsb';
import PinButton from 'components/buttons/Pin';
import NotificationButton from 'components/buttons/NotificationButton';
import { storiesOf } from '@storybook/react';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import colors from 'config/colors';

storiesOf('Buttons', module)
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
            excludedPropTypes: ['children', 'icon', 'className'],
        }),
    )
    .addDecorator(withKnobs)
    .add('Default', () => (
        <Button
            isDisabled={boolean('Disabled', false)}
            isTransparent={boolean('Transparent', false)}
            isWhite={boolean('White', false)}
        >
            {text('Text', 'Button text')}
        </Button>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Web USB', () => {
        const disabled = boolean('Disabled', false);
        if (disabled) {
            return <WebUSB isDisabled>Web USB</WebUSB>;
        }
        return <WebUSB>Web USB</WebUSB>;
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { WebUSB } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Pin button', () => (
        <PinButton>&#8226;</PinButton>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { PinButton } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Notification button', () => {
        const type = select('Type', {
            Success: 'success',
            Warning: 'warning',
            Error: 'error',
        }, 'success');
        const loading = boolean('Loading', false);
        const buttonText = text('Text', 'Confirm!');

        if (loading) {
            return (
                <NotificationButton
                    type={type}
                    isLoading
                >{buttonText}
                </NotificationButton>
            );
        }
        return (
            <NotificationButton type={type}>
                {buttonText}
            </NotificationButton>
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { NotificationButton } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
