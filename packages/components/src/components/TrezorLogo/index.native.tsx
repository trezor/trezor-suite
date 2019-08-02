/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import SvgUri from 'react-native-svg-uri';
import { LOGOS } from './logos';

interface Props {
    type: 'horizontal' | 'vertical';
    variant?: 'white' | 'black';
}

const TrezorLogo = ({ type, variant = 'black', ...rest }: Props) => {
    return <SvgUri fill={variant} source={LOGOS[type.toUpperCase()]} {...rest} />;
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default TrezorLogo;
