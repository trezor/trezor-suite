import React from 'react';

import { storiesOf } from '@storybook/react';

import Loader from 'components/Loader';

storiesOf('Loader', module)
    .addWithJSX('Default', () => (
        <Loader
            size={36}
        />
    ));
