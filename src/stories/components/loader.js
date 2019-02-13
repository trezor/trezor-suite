import Loader from 'components/Loader';
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, number } from '@storybook/addon-knobs';
import centered from '@storybook/addon-centered';

storiesOf('Loader', module)
    .addDecorator(withKnobs)
    .addDecorator(centered)
    .add('Default', () => (
        <Loader
            size={number('Size', 56)}
        />
    ));
