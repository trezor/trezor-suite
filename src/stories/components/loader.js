import Loader from 'components/Loader';
import React from 'react';
import { storiesOf } from '@storybook/react';

storiesOf('Loader', module)
    .addWithJSX('Default', () => (
        <Loader
            size={36}
        />
    ));
