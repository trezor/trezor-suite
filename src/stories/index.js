import React from 'react';
import { setAddon, storiesOf } from '@storybook/react';
import JSXAddon from 'storybook-addon-jsx';
import ButtonText from 'components/buttons/ButtonText';

setAddon(JSXAddon);

storiesOf('Button', module)
    .addWithJSX('with text', () => (
        <ButtonText>Hello Button</ButtonText>
    ));
