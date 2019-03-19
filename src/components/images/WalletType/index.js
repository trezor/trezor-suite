import React from 'react';
import PropTypes from 'prop-types';
import { colors, icons as ICONS } from 'trezor-ui-components';
import styled from 'styled-components';

const SvgWrapper = styled.svg`
    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }
`;

const Path = styled.path`
    fill: ${props => props.color};
`;

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
        viewBox="0 0 1024 1024"
        onClick={onClick}
    >
        <Path
            key={type}
            color={color}
            d={type === 'hidden' ? ICONS.WALLET_HIDDEN : ICONS.WALLET_STANDARD}
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
