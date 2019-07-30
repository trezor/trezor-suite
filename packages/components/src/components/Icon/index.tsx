/* eslint-disable global-require */
import styled, { keyframes } from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import ReactSvg from 'react-svg';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

const ICONS: { [key: string]: string } = {
    ARROW_DOWN: require('../../images/icons/arrow_down.svg'),
    ARROW_LEFT: require('../../images/icons/arrow_left.svg'),
    ARROW_UP: require('../../images/icons/arrow_up.svg'),
    BACK: require('../../images/icons/back.svg'),
    CHAT: require('../../images/icons/chat.svg'),
    CLOSE: require('../../images/icons/close.svg'),
    COG: require('../../images/icons/cog.svg'),
    DOWNLOAD: require('../../images/icons/download.svg'),
    EJECT: require('../../images/icons/eject.svg'),
    ERROR: require('../../images/icons/error.svg'),
    EYE_CROSSED: require('../../images/icons/eye_crossed.svg'),
    EYE: require('../../images/icons/eye.svg'),
    HELP: require('../../images/icons/help.svg'),
    INFO: require('../../images/icons/info.svg'),
    MENU: require('../../images/icons/menu.svg'),
    PLUS: require('../../images/icons/plus.svg'),
    QRCODE: require('../../images/icons/qrcode.svg'),
    REFRESH: require('../../images/icons/refresh.svg'),
    SKIP: require('../../images/icons/skip.svg'),
    SUCCESS: require('../../images/icons/success.svg'),
    T1: require('../../images/icons/t1.svg'),
    T2: require('../../images/icons/t2.svg'),
    TOP: require('../../images/icons/top.svg'),
    WALLET_HIDDEN: require('../../images/icons/wallet_hidden.svg'),
    WALLET_STANDARD: require('../../images/icons/wallet_standard.svg'),
    WARNING: require('../../images/icons/warning.svg'),
};

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

    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }
`;

type WrapperProps = Omit<Props, 'icon'>;
interface Props extends React.SVGAttributes<HTMLDivElement> {
    className?: string;
    icon: string;
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
    color = colors.TEXT_SECONDARY,
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
            <ReactSvg
                src={ICONS[icon]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                    svg.setAttribute('fill', color);
                }}
            />
        </SvgWrapper>
    );
};

Icon.propTypes = {
    className: PropTypes.string,
    hoverColor: PropTypes.string,
    canAnimate: PropTypes.bool,
    icon: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    size: PropTypes.number,
    isActive: PropTypes.bool,
    color: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
    onClick: PropTypes.func,
};

export default Icon;
