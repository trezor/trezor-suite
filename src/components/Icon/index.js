import styled, { keyframes } from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';
import icons from 'config/icons';

const chooseIconAnimationType = (canAnimate, isActive) => {
    if (canAnimate) {
        if (isActive) {
            return rotate180up;
        }
        return rotate180down;
    }
    return null;
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

const SvgWrapper = styled.svg`
    animation: ${props => chooseIconAnimationType(props.canAnimate, props.isActive)} 0.2s linear 1
        forwards;

    :hover {
        path {
            fill: ${props => props.hoverColor};
        }
    }
`;

const Path = styled.path`
    fill: ${props => props.color};
`;

const Icon = ({
    icon,
    size = 24,
    color = colors.TEXT_SECONDARY,
    isActive,
    canAnimate,
    hoverColor,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onClick,
}) => {
    // if string is passed to the icon prop use it as a key in icons object
    const iconObject = typeof icon === 'string' ? icons[icon] : icon;
    if (!iconObject) return null;
    return (
        <SvgWrapper
            className={className}
            canAnimate={canAnimate}
            hoverColor={hoverColor}
            isActive={isActive}
            style={{
                display: 'inline-block',
                verticalAlign: 'middle',
            }}
            width={`${size * (iconObject.ratio || 1)}`}
            height={`${size}`}
            viewBox={iconObject.viewBox || '0 0 1024 1024'}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            onClick={onClick}
        >
            {iconObject.paths.map(path => (
                <Path key={path} isActive={isActive} color={color} d={path} />
            ))}
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
