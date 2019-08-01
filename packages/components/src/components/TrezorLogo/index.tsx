import React from 'react';
import PropTypes from 'prop-types';
import ReactSvg from 'react-svg';
import { LOGOS } from './logos';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: 'horizontal' | 'vertical' | 'symbol';
    variant?: 'white' | 'black';
    width?: string | number;
    height?: string | number;
}

const TrezorLogo = ({ type, variant = 'black', width = 'auto', height = 'auto' }: Props) => {
    return (
        <ReactSvg
            src={LOGOS[type.toUpperCase()]}
            beforeInjection={svg => {
                svg.setAttribute('fill', variant);
            }}
            style={{
                width,
                height,
            }}
        />
    );
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default TrezorLogo;
