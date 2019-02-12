import Button from 'components/buttons/Button';
import React from 'react';
import WebUSB from 'components/buttons/WebUsb';
import { storiesOf } from '@storybook/react';

storiesOf('Buttons', module)
    .addWithJSX('Button primary', () => (
        <Button primary onClick={() => {}}>Primary Button</Button>
    ))
    .addWithJSX('Button primary', () => (
        <Button secondary onClick={() => {}}>Secondary Button</Button>
    ))
    .addWithJSX('Button (disabled)', () => (
        <Button isDisabled onClick={() => {}}>Disabled Button</Button>
    ))
    .addWithJSX('transparent with text ', () => (
        <Button isTransparent onClick={() => {}}>Transparent Button</Button>
    ))
    .addWithJSX('with text (WebUSB)', () => (
        <WebUSB onClick={() => {}}>web usb Button</WebUSB>
    ));
