import React from 'react';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import styled from 'styled-components';

const SvgWrapper = styled.svg`
    :hover {
        path {
            fill: ${props => props.hoverColor}
        }
    }
`;

const Path = styled.path`
    fill: ${props => props.color};
`;

export const HIDDEN = 'M23.9,13.6l-4-11C19.8,2.3,19.4,2,19,2h-3c-0.6,0-1,0.4-1,1s0.4,1,1,1h2.3l3.3,9H14h-4H2.4l3.3-9H8 c0.6,0,1-0.4,1-1S8.6,2,8,2H5C4.6,2,4.2,2.3,4.1,2.7l-4,11C0,13.7,0,13.9,0,14c0,0,0,0,0,0v0c0,0,0,0,0,0v5c0,1.7,1.3,3,3,3h5 c1.7,0,3-1.3,3-3v-4h2v4c0,1.7,1.3,3,3,3h5c1.7,0,3-1.3,3-3v-5c0,0,0,0,0,0v0c0,0,0,0,0,0C24,13.9,24,13.7,23.9,13.6z';
export const STANDARD = 'M23,4H4H3C2.449,4,2,3.551,2,3s0.449-1,1-1h15v1h2V1c0-0.552-0.448-1-1-1H3C1.343,0,0,1.343,0,3v17 c0,2.209,1.791,4,4,4h19c0.552,0,1-0.448,1-1V5C24,4.448,23.552,4,23,4z M18,16c-1.105,0-2-0.895-2-2c0-1.105,0.895-2,2-2 s2,0.895,2,2C20,15.105,19.105,16,18,16z';

const Icon = ({
    type = 'standard',
    size = 24,
    color = colors.TEXT_SECONDARY,
    hoverColor,
    onClick,
}) => (
    <SvgWrapper
        hoverColor={hoverColor}
        width={`${size}`}
        height={`${size}`}
        viewBox="-12 -12 48 48"
        onClick={onClick}
    >
        <Path
            key={type}
            color={color}
            d={type === 'hidden' ? HIDDEN : STANDARD}
        />
    </SvgWrapper>
);

Icon.propTypes = {
    type: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    onClick: PropTypes.func,
};

export default Icon;