import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';
import styled, { css } from 'styled-components';
import Icon from 'components/Icon';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';
import { SPIN } from 'config/animations';

const FluidSpinner = styled.div`
    /* https://loading.io/css/ */
    width: 16px;
    height: 16px;

    div {
        position: absolute;
        box-sizing: border-box;
        width: 16px;
        height: 16px;
        border: ${props => (props.strokeWidth ? `${props.strokeWidth}px` : '1px')} solid transparent;
        border-radius: 50%;
        animation: ${SPIN} 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: #fff transparent transparent transparent;
        border-top-color: ${props => (props.color ? props.color : 'inherit')};
    }

    div:nth-child(1) {
        animation-delay: -0.45s;
    }

    div:nth-child(2) {
        animation-delay: -0.3s;
    }

    div:nth-child(3) {
        animation-delay: -0.15s;
    }
`;

// Simple sweet css spinner without bullshit
// const Spinner = styled.div`
//     border: 2px solid ${colors.white};
//     border-top: 2px solid transparent;
//     border-radius: 50%;
//     width: ${props => `${props.size}px`};
//     height: ${props => `${props.size}px`};
//     animation: ${SPIN} 1s linear infinite;
// `;

const Wrapper = styled.button`
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    padding: 11px 24px;
    border-radius: 3px;
    font-size: ${FONT_SIZE.BASE};
    font-weight: ${FONT_WEIGHT.LIGHT};
    cursor: pointer;
    outline: none;
    background: ${colors.GREEN_PRIMARY};
    color: ${colors.WHITE};
    border: 1px solid ${colors.GREEN_PRIMARY};
    transition: ${TRANSITION.HOVER};

    &:hover {
        background: ${colors.GREEN_SECONDARY};
    }

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
    }

    &:active {
        background: ${colors.GREEN_TERTIARY};
    }

    ${props =>
        props.icon &&
        css`
            svg {
                path {
                    transition: ${TRANSITION.HOVER};
                }
            }
        `}

    ${props =>
        props.isInverse &&
        !props.isDisabled &&
        css`
            background: transparent;
            color: ${colors.GREEN_PRIMARY};
            border: 1px solid ${colors.GREEN_PRIMARY};
            &:hover,
            &:active {
                background: ${colors.GREEN_PRIMARY};
                color: ${colors.WHITE};

                &:before,
                &:after {
                    background: ${colors.WHITE};
                }

                svg {
                    path {
                        fill: ${colors.WHITE};
                    }
                }
            }

            &:active {
                background: ${colors.GREEN_TERTIARY};
            }
        `}

    ${props =>
        props.isDisabled &&
        css`
            pointer-events: none;
            color: ${colors.TEXT_SECONDARY};
            background: ${colors.GRAY_LIGHT};
            border: 1px solid ${colors.DIVIDER};

            &:focus {
                background: ${colors.GRAY_LIGHT};
            }

            svg {
                path {
                    fill: ${colors.TEXT_SECONDARY};
                }
            }
        `}

    ${props =>
        props.isWhite &&
        css`
            background: ${colors.WHITE};
            color: ${colors.TEXT_SECONDARY};
            border: 1px solid ${colors.DIVIDER};

            &:hover {
                color: ${colors.TEXT_PRIMARY};
                background: ${colors.DIVIDER};

                svg {
                    path {
                        fill: ${colors.TEXT_PRIMARY};
                    }
                }
            }

            svg {
                path {
                    fill: ${colors.TEXT_SECONDARY};
                }
            }

            &:active {
                color: ${colors.TEXT_PRIMARY};
                background: ${colors.DIVIDER};
            }
        `}

    ${props =>
        props.isTransparent &&
        css`
            background: transparent;
            border-color: transparent;
            color: ${colors.TEXT_SECONDARY};

            &:hover,
            &:active,
            &:focus {
                color: ${colors.TEXT_PRIMARY};
                background: transparent;
                box-shadow: none;

                svg {
                    path {
                        fill: ${colors.TEXT_PRIMARY};
                    }
                }
            }

            svg {
                path {
                    fill: ${colors.TEXT_SECONDARY};
                }
            }
        `}
`;

const IconWrapper = styled.div`
    margin-right: 0.8rem;
`;

const Button = ({
    children,
    className,
    additionalClassName,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    isDisabled = false,
    isWhite = false,
    isTransparent = false,
    isInverse = false,
    isLoading = false,
    icon = null,
    ...rest
}) => {
    const newClassName = additionalClassName ? `${className} ${additionalClassName}` : className;
    return (
        <Wrapper
            className={newClassName}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            isDisabled={isDisabled}
            isWhite={isWhite}
            isTransparent={isTransparent}
            isInverse={isInverse}
            isLoading={isLoading}
            icon={icon}
            {...rest}
        >
            {isLoading && (
                <IconWrapper>
                    <FluidSpinner>
                        <div />
                        <div />
                        <div />
                        <div />
                    </FluidSpinner>
                </IconWrapper>
            )}
            {!isLoading && icon && (
                <IconWrapper>
                    <Icon
                        icon={icon}
                        size={14}
                        color={isInverse ? colors.GREEN_PRIMARY : colors.WHITE}
                    />
                </IconWrapper>
            )}
            {children}
        </Wrapper>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    additionalClassName: PropTypes.string,
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
    isDisabled: PropTypes.bool,
    isWhite: PropTypes.bool,
    isTransparent: PropTypes.bool,
    isInverse: PropTypes.bool,
    isLoading: PropTypes.bool,
    icon: PropTypes.object,
};

export default Button;
