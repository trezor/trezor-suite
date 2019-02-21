import { FONT_SIZE, FONT_WEIGHT } from 'config/variables';
import styled, { css } from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';

const Wrapper = styled.button`
    padding: ${props => (props.icon ? '4px 24px 4px 15px' : '11px 24px')};
    border-radius: 3px;
    font-size: ${FONT_SIZE.BASE};
    font-weight: ${FONT_WEIGHT.LIGHT};
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

    ${props => props.isDisabled
        && css`
            pointer-events: none;
            color: ${colors.TEXT_SECONDARY};
            background: ${colors.GRAY_LIGHT};
        `}

    ${props => props.isWhite
        && css`
            background: ${colors.WHITE};
            color: ${colors.TEXT_SECONDARY};
            border: 1px solid ${colors.DIVIDER};

            &:hover {
                color: ${colors.TEXT_PRIMARY};
                background: ${colors.DIVIDER};
            }

            &:active {
                color: ${colors.TEXT_PRIMARY};
                background: ${colors.DIVIDER};
            }
        `}

    ${props => props.isTransparent
        && css`
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
    children,
    className = '',
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    isDisabled = false,
    isWhite = false,
    isTransparent = false,
}) => (
    <Wrapper
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        isDisabled={isDisabled}
        isWhite={isWhite}
        isTransparent={isTransparent}
    >
        {children}
    </Wrapper>
);

Button.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
    isDisabled: PropTypes.bool,
    isWhite: PropTypes.bool,
    isTransparent: PropTypes.bool,
};

export default Button;
