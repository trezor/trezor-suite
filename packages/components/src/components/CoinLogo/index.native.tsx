/* eslint-disable global-require */
import React from 'react';
import SvgUri from 'react-native-svg-uri';
import { COINS } from './coins';

interface Props {
    network: string;
    size: number | string;
}

const CoinLogo = ({ network, size = 32 }: Props) => {
    return <SvgUri source={COINS[network]} width={size} height={size} />;
};

export { CoinLogo, Props as CoinLogoProps };
