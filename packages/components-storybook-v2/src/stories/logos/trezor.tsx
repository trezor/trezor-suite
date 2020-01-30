import React from 'react';
import { TrezorLogo } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { number, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/info';

storiesOf('Logos', module).add(
    'Trezor',
    () => {
        type LogoType = 'horizontal' | 'vertical';
        type LogoVariant = 'black' | 'white';

        const width = number('width', 100);
        const height = number('height', NaN);
        const type = select(
            'type',
            {
                horizontal: 'horizontal',
                vertical: 'vertical',
                symbol: 'symbol',
            },
            'horizontal'
        ) as LogoType;
        const variant = select(
            'variant',
            {
                black: 'black',
                white: 'white',
            },
            'black'
        ) as LogoVariant;

        return (
            <TrezorLogo
                type={type}
                variant={variant}
                {...(width ? { width } : {})}
                {...(height ? { height } : {})}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
    ~~~js
    import { TrezorLogo } from 'trezor-ui-components';
    ~~~
    *<TrezorLogo> is just a styled <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*
    `,
        },
    }
);
