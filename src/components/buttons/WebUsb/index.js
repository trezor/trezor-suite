import * as React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import colors from '../../../config/colors';
import { TRANSITION, FONT_WEIGHT, FONT_SIZE } from '../../../config/variables';

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

    position: relative;
    padding: 12px 24px 12px 40px;
    background: transparent;
    color: ${colors.GREEN_PRIMARY};
    border: 1px solid ${colors.GREEN_PRIMARY};
    transition: ${TRANSITION.HOVER};

    &:before,
    &:after {
        content: "";
        position: absolute;
        background: ${colors.GREEN_PRIMARY};
        top: 0;
        bottom: 0;
        margin: auto;
        transition: ${TRANSITION.HOVER};
    }

    &:before {
        width: 12px;
        height: 2px;
        left: 18px;
    }

    &:after {
        width: 2px;
        height: 12px;
        left: 23px;
    }

    &:hover {
        background: ${colors.GREEN_PRIMARY};
        color: ${colors.WHITE};

        &:before,
        &:after {
            background: ${colors.WHITE};
        }
    }

    iframe {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
    }
`;

const ButtonWebUSB = ({
    children,
    className = 'trezor-webusb-button',
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    isDisabled = false,
}) => (
    <Wrapper
        className={className}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        isDisabled={isDisabled}
    >
        {children}
    </Wrapper>
);

ButtonWebUSB.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
    isDisabled: PropTypes.bool,
};

export default ButtonWebUSB;
