/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import SvgUri from 'react-native-svg-uri';
import { COINS } from './coins';

interface Props {
    network: string;
    size: number | string;
}

const CoinLogo = ({ network, size = 32 }: Props) => {
    return <SvgUri source={COINS[network]} width={size} height={size} />;
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default CoinLogo;
