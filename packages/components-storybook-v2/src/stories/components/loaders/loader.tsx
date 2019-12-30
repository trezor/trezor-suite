import React from 'react';
import { Loader } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { number, boolean, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Loaders', module).add(
    'Loader',
    () => {
        const isWhiteText = boolean('White text', false);
        const isSmallText = boolean('Small text', false);
        const transparentRoute = boolean('Transparent route', false);

        return (
            <Loader
                size={number('Size', 100)}
                strokeWidth={number('Stroke width', 2)}
                text={text('Text', 'loading')}
                {...(isWhiteText ? { isWhiteText } : {})}
                {...(isSmallText ? { isSmallText } : {})}
                {...(transparentRoute ? { transparentRoute } : {})}
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
