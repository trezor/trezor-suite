import styled, { keyframes } from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import ReactSvg from 'react-svg';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

const LOGOS: { [key: string]: string } = {
    ARROW_DOWN: '../../images/icons/arrow_down.svg',
    ARROW_LEFT: '../../images/icons/arrow_left.svg',
    ARROW_UP: '../../images/icons/arrow_up.svg',
    BACK: '../../images/icons/back.svg',
    CHAT: '../../images/icons/chat.svg',
    CLOSE: '../../images/icons/close.svg',
    COG: '../../images/icons/cog.svg',
    DOWNLOAD: '../../images/icons/download.svg',
    EJECT: '../../images/icons/eject.svg',
    ERROR: '../../images/icons/error.svg',
    EYE_CROSSED: '../../images/icons/eye_crossed.svg',
    EYE: '../../images/icons/eye.svg',
    HELP: '../../images/icons/help.svg',
    INFO: '../../images/icons/info.svg',
    MENU: '../../images/icons/menu.svg',
    PLUS: '../../images/icons/plus.svg',
    QRCODE: '../../images/icons/qrcode.svg',
    REFRESH: '../../images/icons/refresh.svg',
    SKIP: '../../images/icons/skip.svg',
    SUCCESS: '../../images/icons/success.svg',
    T1: '../../images/icons/t1.svg',
    T2: '../../images/icons/t2.svg',
    TOP: '../../images/icons/top.svg',
    WALLET_HIDDEN: '../../images/icons/wallet_hidden.svg',
    WALLET_STANDARD: '../../images/icons/wallet_standard.svg',
    WARNING: '../../images/icons/warning.svg',
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
    animation: ${props => chooseIconAnimationType(props.canAnimate, props.isActive)} 0.2s linear 1
        forwards;

    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }
`;

type WrapperProps = Omit<Props, 'icon' | 'size'>;
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
    return <ReactSvg src={LOGOS.TOP} />;
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
