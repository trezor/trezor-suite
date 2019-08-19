/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import SvgUri from 'react-native-svg-uri';
import { LOGOS } from './logos';
import { TrezorLogoType, TrezorLogoVariant } from '../../support/types';

interface Props {
    type: TrezorLogoType;
    variant?: TrezorLogoVariant;
}

const TrezorLogo = ({ type, variant = 'black', ...rest }: Props) => {
    return <SvgUri fill={variant} source={LOGOS[type.toUpperCase()]} {...rest} />;
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export { TrezorLogo, Props as TrezorLogoProps };
