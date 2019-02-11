import ButtonText from 'components/buttons/ButtonText';
import ButtonWebUSB from 'components/buttons/ButtonWebUSB';
import React from 'react';
import { storiesOf } from '@storybook/react';

storiesOf('Buttons', module)
    .addWithJSX('with text', () => (
        <ButtonText onClick={() => {}}>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (disabled)', () => (
        <ButtonText isDisabled onClick={() => {}}>Hello Button</ButtonText>
    ))
    .addWithJSX('transparent with text ', () => (
        <ButtonText isTransparent onClick={() => {}}>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (WebUSB)', () => (
        <ButtonWebUSB onClick={() => {}}>Hello Button</ButtonWebUSB>
    ));
