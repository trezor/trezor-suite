import React from 'react';
import Button from 'components/buttons/Button';
import WebUSB from 'components/buttons/WebUsb';
import PinButton from 'components/buttons/Pin';
import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';
import {
    withKnobs, text, boolean,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

storiesOf('Buttons', module)
    .addDecorator(
        withInfo({
            header: true,
            excludedPropTypes: ['children'],
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
    ));
