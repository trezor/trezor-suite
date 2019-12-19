import styled, { keyframes } from 'styled-components';

import React from 'react';
import { ReactSVG } from 'react-svg';
import colors from '../../config/colors';
import { IconType } from '../../support/types';
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
    display: inline-block;
    height: ${props => props.size}px;
    animation: ${props => chooseIconAnimationType(props.canAnimate, props.isActive)} 0.2s linear 1
        forwards;

    div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }

    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }
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
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => any;
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => any;
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => any;
    onFocus?: (event: React.FocusEvent<HTMLDivElement>) => any;
}

const Icon = ({
    icon,
    size = 24,
    color = colors.BLACK50,
    isActive,
    canAnimate,
    hoverColor,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    ...rest
}: Props) => {
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
            {...rest}
        >
            <ReactSVG
                src={ICONS[icon]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                    svg.setAttribute('fill', color);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgWrapper>
    );
};

export { Icon };
