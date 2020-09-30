import React from 'react';
import { Spinner, colors } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/storybook';

storiesOf('Loaders', module).add(
    'Spinner',
    () => {
        return (
            <Spinner
                size={number('Size', 100)}
                strokeWidth={number('Stroke width', 2)}
                color={text('color', colors.NEUE_TYPE_GREEN)}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Spinner } from 'trezor-ui-components';
        ~~~
        `,
        },
    }
);
