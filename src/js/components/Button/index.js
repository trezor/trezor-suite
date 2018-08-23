import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import React from 'react';

import colors from 'config/colors';

const Wrapper = styled.button`
    padding: 12px 24px;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    background: ${colors.GREEN_PRIMARY};
    color: ${colors.WHITE};
    border: 0;

    &:hover {
        background: ${colors.GREEN_SECONDARY};
    }

    &:active {
        background: ${colors.GREEN_TERTIARY};
    }

    ${props => props.disabled && css`
        pointer-events: none;
        color: ${colors.TEXT_SECONDARY};
        background: ${colors.GRAY_LIGHT};
    `}

    ${props => props.blue && css`
        background: transparent;
        border: 1px solid ${colors.INFO_PRIMARY};
        color: ${colors.INFO_PRIMARY};
        padding: 12px 58px;

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.INFO_PRIMARY};
        }
    `}

    ${props => props.white && css`
        background: @color_white;
        color: ${colors.TEXT_SECONDARY};
        border: 1px solid ${colors.DIVIDER};
        
        &:hover {
            color: ${colors.TEXT_PRIMARY};
            border-color: ${colors.TEXT_PRIMARY};
            background: ${colors.DIVIDER};
        }
        
        &:active {
            color: ${colors.TEXT_PRIMARY};
            background: ${colors.DIVIDER};
        }
    `}

    ${props => props.transparent && css`
        background: transparent;
        border: 0px;
        color: ${colors.TEXT_SECONDARY};

        &:hover,
        &:active {
            color: ${colors.TEXT_PRIMARY};
            background: transparent;
        }
    `}
`;

const Button = ({
    text, onClick, disabled, blue, white, transparent,
}) => (
    <Wrapper
        onClick={onClick}
        disabled={disabled}
        blue={blue}
        transparent={transparent}
        white={white}
    >{text}
    </Wrapper>
);

Button.propTypes = {
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    blue: PropTypes.bool,
    transparent: PropTypes.bool,
    white: PropTypes.bool,
    text: PropTypes.string.isRequired,
};

Button.defaultProps = {
    onClick: () => {},
    disabled: false,
    blue: false,
    white: false,
};

export default Button;