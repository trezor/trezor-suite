import React from 'react';
import Button from 'components/buttons/Button';
import WebUSB from 'components/buttons/WebUsb';
import PinButton from 'components/buttons/Pin';
import NotificationButton from 'components/buttons/NotificationButton';
import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

storiesOf('Buttons', module)
    .addDecorator(
        withInfo({
            header: true,
            excludedPropTypes: ['children', 'icon', 'className'],
        }),
    )
    .addDecorator(centered)
    .addDecorator(withKnobs)
    .add('Default', () => (
        <Button
            isDisabled={boolean('Disabled', false)}
            isTransparent={boolean('Transparent', false)}
            isWhite={boolean('White', false)}
        >
            {text('Text', 'Button text')}
        </Button>
    ))
    .add('Web USB', () => (
        <WebUSB isDisabled={boolean('Disabled', false)}>Web USB</WebUSB>
    ))
    .add('Pin button', () => (
        <PinButton>●</PinButton>
    ))
    .add('Notification button', () => {
        const type = select('Type', {
            Success: 'success',
            Warning: 'warning',
            Error: 'error',
        }, 'success');

        return (
            <NotificationButton
                type={type}
                isLoading={boolean('Loading', false)}
            >{text('Text', 'Confirm!')}
            </NotificationButton>
        );
    });
