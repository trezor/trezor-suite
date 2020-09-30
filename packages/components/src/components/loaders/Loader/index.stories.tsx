import React from 'react';
import { Loader } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/storybook';

storiesOf('Loaders', module).add(
    'Loader',
    () => {

        return (
            <Loader
                size={number('Size', 50)}
                strokeWidth={number('Stroke width', 1)}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Loader } from 'trezor-ui-components';
        ~~~
        `,
        },
    }
);
