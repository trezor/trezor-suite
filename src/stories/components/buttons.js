import React from 'react';
import Button from 'components/buttons/Button';
import ButtonWebUSB from 'components/buttons/WebUsb';
import ButtonPin from 'components/buttons/Pin';
import ButtonNotification from 'components/buttons/Notification';
import { storiesOf } from '@storybook/react';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import colors from 'config/colors';

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
            excludedPropTypes: ['children', 'icon', 'className'],
        }),
    )
    .addDecorator(withKnobs)
    .add('Button', () => (
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
    .add('Button Web USB', () => {
        const disabled = boolean('Disabled', false);
        if (disabled) {
            return <ButtonWebUSB isDisabled>Web USB</ButtonWebUSB>;
        }
        return <ButtonWebUSB>Web USB</ButtonWebUSB>;
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonWebUSB } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Button Pin', () => (
        <ButtonPin>&#8226;</ButtonPin>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonPin } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Button Notification', () => {
        const type = select('Type', {
            Success: 'success',
            Warning: 'warning',
            Error: 'error',
        }, 'success');
        const loading = boolean('Loading', false);
        const buttonText = text('Text', 'Confirm!');

        if (loading) {
            return (
                <ButtonNotification
                    type={type}
                    isLoading
                >{buttonText}
                </ButtonNotification>
            );
        }
        return (
            <ButtonNotification type={type}>
                {buttonText}
            </ButtonNotification>
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonNotification } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
