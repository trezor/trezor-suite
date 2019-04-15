import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';
import styled, { css } from 'styled-components';
import Icon from 'components/Icon';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';

interface Props {
    isDisabled: boolean;
    isInverse: boolean;
    aaa: string;
    isWhite: boolean;
    isTransparent: boolean;
    additionalClassName: string;
    children: ReactNode;
}

const Wrapper = styled.button<Props>`
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
                margin-right: 0.8rem;
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
            icon={icon}
            {...rest}
        >
            {icon && (
                <Icon
                    icon={icon}
                    size={14}
                    color={isInverse ? colors.GREEN_PRIMARY : colors.WHITE}
                />
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
    icon: PropTypes.object,
};

export default Button;
