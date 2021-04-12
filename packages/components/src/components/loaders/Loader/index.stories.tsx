import React from 'react';
import { Loader } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number } from '@storybook/addon-knobs';

storiesOf('Loaders', module).add('Loader', () => (
    <Loader size={number('Size', 50)} strokeWidth={number('Stroke width', 1)} />
));
