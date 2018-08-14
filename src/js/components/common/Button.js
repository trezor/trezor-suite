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
`;

const Button = ({
    text, onClick, disabled, blue, white,
}) => (
    <Wrapper
        onClick={onClick}
        disabled={disabled}
        blue={blue}
        white={white}
    >{text}
    </Wrapper>
);

Button.propTypes = {
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    blue: PropTypes.bool,
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
