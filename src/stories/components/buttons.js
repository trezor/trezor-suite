import Button from 'components/buttons/Button';
import React from 'react';
import WebUSB from 'components/buttons/WebUsb';
import { storiesOf } from '@storybook/react';
import centered from '@storybook/addon-centered';

storiesOf('Buttons', module)
    .addDecorator(centered)
    .add('Button primary', () => (
        <Button primary onClick={() => {}}>Primary Button</Button>
    ))
    .add('Button primary', () => (
        <Button secondary onClick={() => {}}>Secondary Button</Button>
    ))
    .add('Button (disabled)', () => (
        <Button isDisabled onClick={() => {}}>Disabled Button</Button>
    ))
    .add('transparent with text ', () => (
        <Button isTransparent onClick={() => {}}>Transparent Button</Button>
    ))
    .add('with text (WebUSB)', () => (
        <WebUSB onClick={() => {}}>web usb Button</WebUSB>
    ));
