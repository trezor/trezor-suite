import React from 'react';
import { setAddon, storiesOf } from '@storybook/react';
import JSXAddon from 'storybook-addon-jsx';
import ButtonText from 'components/buttons/ButtonText';

setAddon(JSXAddon);

storiesOf('Buttons', module)
    .addWithJSX('with text', () => (
        <ButtonText>Hello Button</ButtonText>
    )).addWithJSX('with text (disabled)', () => (
        <ButtonText isDisabled>Hello Button</ButtonText>
    )).addWithJSX('transparent with text ', () => (
        <ButtonText isTransparent>Hello Button</ButtonText>
    ));
