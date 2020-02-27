import React from 'react';
import { CoinLogo, variables } from '../../index';
import { storiesOf } from '@storybook/react';
import { number, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/storybook';

storiesOf('Logos', module).add(
    'Coin',
    () => {
        const coinsObject: any = {};
        variables.COINS.forEach((coin: string) => {
            coinsObject[coin] = coin;
        });
        const coinSelect = select('symbol', coinsObject, 'ada');
        const size = number('size', 32);
        return <CoinLogo size={size} symbol={coinSelect} />;
    },
    {
        info: {
            ...infoOptions,
            text: `

        ~~~js
        Import { CoinLogo } from 'trezor-ui-components';
        ~~~

        *<CoinLogo> is just a styling wrapper around <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*

        `,
        },
    }
);
