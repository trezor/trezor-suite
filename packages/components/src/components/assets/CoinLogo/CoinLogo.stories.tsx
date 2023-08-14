import React from 'react';
import { CoinLogo, variables } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number, select } from '@storybook/addon-knobs';

storiesOf('Assets/CoinLogos', module).add('CoinLogo', () => {
    const coinsObject: any = {};
    variables.COINS.forEach((coin: string) => {
        coinsObject[coin] = coin;
    });
    const coinSelect = select('symbol', coinsObject, 'ada');
    const size = number('size', 32);
    return <CoinLogo size={size} symbol={coinSelect} />;
});
