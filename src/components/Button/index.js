import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import colors from 'config/colors';
import { TRANSITION } from 'config/variables';

const Wrapper = styled.button`
    padding: ${props => (props.icon ? '4px 24px 4px 15px' : '11px 24px')};
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

    ${props => props.color === 'blue' && css`
        background: transparent;
        border: 1px solid ${colors.INFO_PRIMARY};
        color: ${colors.INFO_PRIMARY};
        padding: 12px 58px;

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.INFO_PRIMARY};
        }
    `}

    ${props => props.color === 'white' && css`
        background: ${colors.WHITE};
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

    ${props => props.isTransparent && css`
        background: transparent;
        border: 0px;
        color: ${colors.TEXT_SECONDARY};

        &:hover,
        &:active {
            color: ${colors.TEXT_PRIMARY};
            background: transparent;
        }
    `}

    ${props => props.isWebUsb && css`
        position: relative;
        padding: 12px 24px 12px 40px;
        background: transparent;
        color: ${colors.GREEN_PRIMARY};
        border: 1px solid ${colors.GREEN_PRIMARY};
        transition: ${TRANSITION.HOVER};

        &:before,
        &:after {
            content: '';
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
    `}
`;

const IconWrapper = styled.span`
    margin-right: 8px;
`;

const Button = ({
    className, text, icon, onClick = () => { }, disabled, color = null, isWhite = false, isWebUsb = false, isTransparent = false,
}) => (
    <Wrapper
        className={className}
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        color={color}
        isWhite={isWhite}
        isWebUsb={isWebUsb}
        isTransparent={isTransparent}
    >
        {icon && (
            <IconWrapper>
                <Icon
                    icon={icon.type}
                    color={icon.color}
                    size={icon.size}
                />
            </IconWrapper>
        )}
        {text}
    </Wrapper>
);

Button.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    color: PropTypes.string,
    isWhite: PropTypes.bool,
    isWebUsb: PropTypes.bool,
    isTransparent: PropTypes.bool,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
    text: PropTypes.string.isRequired,
};

export default Button;