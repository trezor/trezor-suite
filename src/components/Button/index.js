import * as React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';

const Wrapper = styled.button`
    padding: ${props => (props.icon ? '4px 24px 4px 15px' : '11px 24px')};
    border-radius: 3px;
    font-size: ${FONT_SIZE.BASE};
    font-weight: ${FONT_WEIGHT.LIGHT};
    cursor: pointer;
    background: ${colors.GREEN_PRIMARY};
    color: ${colors.WHITE};
    border: 1px solid black;

    &:hover {
        background: ${colors.GREEN_SECONDARY};
    }

    ${props => props.isDisabled && css`
        pointer-events: none;
        color: ${colors.TEXT_SECONDARY};
        background: ${colors.GRAY_LIGHT};
    `}
`;

const Button = ({
    children,
    onClick,
}) => (
    <Wrapper
        onClick={onClick}
    >
        {children}
    </Wrapper>
);

Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
};

export default Button;