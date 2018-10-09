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

export const HIDDEN = 'M25.421,17.28l-3.167-8.8C22.175,8.24,21.858,8,21.542,8h-2.375c-0.475,0-0.792,0.32-0.792,0.8c0,0.48,0.317,0.8,0.792,0.8h1.821l2.612,7.2h-6.017h-3.167H8.4l2.613-7.2h1.821c0.475,0,0.792-0.32,0.792-0.8c0-0.48-0.317-0.8-0.792-0.8h-2.375c-0.317,0-0.633,0.24-0.712,0.56l-3.167,8.8C6.5,17.36,6.5,17.52,6.5,17.6l0,0l0,0l0,0v4c0,1.36,1.029,2.4,2.375,2.4h3.958c1.346,0,2.375-1.04,2.375-2.4v-3.2h1.583v3.2c0,1.36,1.029,2.4,2.375,2.4h3.958c1.346,0,2.375-1.04,2.375-2.4v-4l0,0l0,0l0,0C25.5,17.52,25.5,17.36,25.421,17.28z';
export const STANDARD = 'M23.333,10.667H10.667H10c-0.367,0-0.667-0.299-0.667-0.667S9.633,9.333,10,9.333h10V10h1.333V8.667C21.333,8.299,21.035,8,20.667,8H10c-1.105,0-2,0.895-2,2v11.333C8,22.806,9.194,24,10.667,24h12.667C23.701,24,24,23.701,24,23.333v-12C24,10.965,23.701,10.667,23.333,10.667z M20,18.667c-0.737,0-1.333-0.597-1.333-1.333C18.667,16.597,19.263,16,20,16s1.333,0.597,1.333,1.333C21.333,18.07,20.737,18.667,20,18.667z';

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
        viewBox="0 0 32 32"
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