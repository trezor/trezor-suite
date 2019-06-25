/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import TrezorLogoHorizontal from './trezor_logo_horizontal';
import TrezorLogoVertical from './trezor_logo_vertical';

const LOGOS: { [key: string]: any } = {
    horizontal: TrezorLogoHorizontal,
    vertical: TrezorLogoVertical,
};

interface Props {
    type: 'horizontal' | 'vertical';
}

const TrezorLogo = ({ type, ...rest }: Props) => {
    const Logo = LOGOS[type];
    return <Logo {...rest} />;
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default TrezorLogo;
