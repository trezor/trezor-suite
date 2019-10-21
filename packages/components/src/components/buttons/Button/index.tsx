import * as React from 'react';
import styled, { css } from 'styled-components';

import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from '../../../config/variables';
import { Icon } from '../../Icon';
import { getPrimaryColor, getSecondaryColor } from '../../../utils/colors';
import colors from '../../../config/colors';
import FluidSpinner from '../../FluidSpinner';
import { ButtonVariant, IconType } from '../../../support/types';

const Wrapper = styled.button<Props>`
    display: flex;
    position: relative;
    align-items: center;
    padding: 11px 24px;
    text-align: center;
    border-radius: 3px;
    font-size: ${FONT_SIZE.BASE};
    font-weight: ${FONT_WEIGHT.LIGHT};
    cursor: pointer;
    outline: none;
    background: ${props => getPrimaryColor(props.variant)};
    color: ${colors.WHITE};
    border: 1px solid ${props => getPrimaryColor(props.variant)};
    transition: ${TRANSITION.HOVER};
    justify-content: ${(props: Props) =>
        props.align === 'right' ? 'flex-end' : props.align || 'center'};

    &:hover {
        background: ${props => getSecondaryColor(props.variant)};
    }

    &:focus {
        box-shadow: ${colors.INPUT_FOCUS_SHADOW} 0px 0px 6px 0px;
    }

    &:active {
        background: ${props => getSecondaryColor(props.variant)};
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
            color: ${getPrimaryColor(props.variant)};
            border: 1px solid ${getPrimaryColor(props.variant)};
            &:hover,
            &:active {
                background: ${getPrimaryColor(props.variant)};
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
                background: ${getPrimaryColor(props.variant)};
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
        props.fullWidth &&
        css`
            width: 100%;
            vertical-align: middle;
        `}

    ${props =>
        props.variant === 'white' &&
        css`
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

const TextWrapper = styled.div`
    display: flex;
`;

const IconWrapper = styled.div`
    align-items: center;
    margin-right: 0.8rem;
    display: flex;
    justify-content: center;
`;

// TODO: Error messages are not helpful. Find a better way to extend html button props.
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    additionalClassName?: string;
    isDisabled?: boolean;
    isInverse?: boolean;
    isTransparent?: boolean;
    isLoading?: boolean;
    icon?: IconType;
    variant?: ButtonVariant;
    fullWidth?: boolean;
    align?: string;
}

const Button = ({
    children,
    className,
    additionalClassName,

    variant = 'success',
    isDisabled = false,
    isTransparent = false,
    isInverse = false,
    isLoading = false,
    fullWidth = false,
    align = 'center',
    icon,
    ...rest
}: Props) => {
    const newClassName = additionalClassName ? `${className} ${additionalClassName}` : className;
    return (
        <Wrapper
            className={newClassName}
            isDisabled={isDisabled}
            isTransparent={isTransparent}
            isInverse={isInverse}
            isLoading={isLoading}
            fullWidth={fullWidth}
            variant={variant}
            icon={icon}
            align={align}
            {...rest}
        >
            {isLoading && (
                <IconWrapper>
                    <FluidSpinner size={16} />
                </IconWrapper>
            )}
            {!isLoading && icon && (
                <IconWrapper>
                    <Icon
                        icon={icon}
                        size={14}
                        color={isInverse ? getPrimaryColor(variant) || colors.WHITE : colors.WHITE}
                    />
                </IconWrapper>
            )}
            <TextWrapper>{children}</TextWrapper>
        </Wrapper>
    );
};

export { Button, Props as ButtonProps };
