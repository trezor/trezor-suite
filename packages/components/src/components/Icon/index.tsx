import styled, { keyframes, css } from 'styled-components';

import React from 'react';
import { ReactSVG } from 'react-svg';
import { IconType } from '../../support/types';
import { useTheme } from '../../utils';
import { ICONS } from './icons';

// TODO: make animation of icons better
const rotate180up = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(180deg);
    }
`;

const rotate180down = keyframes`
    from {
        transform: rotate(180deg);
    }
    to {
        transform: rotate(0deg);
    }
`;

const chooseIconAnimationType = (canAnimate?: boolean, isActive?: boolean) => {
    if (canAnimate) {
        if (isActive) {
            return rotate180up;
        }
        return rotate180down;
    }
    return null;
};

const SvgWrapper = styled.div<WrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
    animation: ${props => chooseIconAnimationType(props.canAnimate, props.isActive)} 0.2s linear 1
        forwards;

    div {
        display: flex;
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
        align-items: center;
        justify-content: center;
    }

    span {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }

    ${props =>
        props.useCursorPointer &&
        css`
            cursor: pointer;
        `}
`;

type WrapperProps = Omit<Props, 'icon'>;
interface Props extends React.SVGAttributes<HTMLDivElement> {
    className?: string;
    icon: IconType;
    size?: number;
    color?: string;
    isActive?: boolean;
    canAnimate?: boolean;
    hoverColor?: string;
    useCursorPointer?: boolean;
}

const Icon = React.forwardRef(
    (
        {
            icon,
            size = 24,
            color,
            isActive,
            canAnimate,
            hoverColor,
            useCursorPointer,
            className,
            onClick,
            onMouseEnter,
            onMouseLeave,
            onFocus,
            ...rest
        }: Props,
        ref?: React.Ref<HTMLDivElement>
    ) => {
        const theme = useTheme();
        const defaultColor = color ?? theme.TYPE_LIGHT_GREY;
        return (
            <SvgWrapper
                className={className}
                canAnimate={canAnimate}
                hoverColor={hoverColor}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onFocus={onFocus}
                isActive={isActive}
                size={size}
                ref={ref}
                useCursorPointer={onClick !== undefined || useCursorPointer}
                color={defaultColor}
                {...rest}
            >
                <ReactSVG
                    src={ICONS[icon]}
                    beforeInjection={svg => {
                        svg.setAttribute('width', `${size}px`);
                        svg.setAttribute('height', `${size}px`);
                        svg.setAttribute('fill', defaultColor);
                    }}
                    loading={() => <span className="loading" />}
                />
            </SvgWrapper>
        );
    }
);

export { Icon, Props as IconProps };
