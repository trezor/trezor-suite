import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import ButtonText from 'components/buttons/ButtonText';
import ButtonWebUSB from 'components/buttons/ButtonWebUSB';

storiesOf('Buttons', module)
    .addWithJSX('with text', () => (
        <ButtonText onClick={action('Button clicked')}>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (disabled)', () => (
        <ButtonText isDisabled onClick={action('Button clicked')}>Hello Button</ButtonText>
    ))
    .addWithJSX('transparent with text ', () => (
        <ButtonText isTransparent onClick={action('Button clicked')}>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (WebUSB)', () => (
        <ButtonWebUSB onClick={action('Button clicked')}>Hello Button</ButtonWebUSB>
    ));
