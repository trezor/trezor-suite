import React from 'react';
import PropTypes from 'prop-types';
import colors from 'config/colors';
import styled, { keyframes } from 'styled-components';

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
    animation: ${props => (props.canAnimate ? (props.isActive ? rotate180up : rotate180down) : null)} 0.2s linear 1 forwards;

    :hover {
        path {
            fill: ${props => props.hoverColor}
        }
    }
`;

const Path = styled.path`
    fill: ${props => props.color};
`;

const Icon = ({
    icon,
    size = 32,
    color = colors.TEXT_SECONDARY,
    isActive,
    canAnimate,
    hoverColor,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onClick,
}) => (
    <SvgWrapper
        className={className}
        canAnimate={canAnimate}
        hoverColor={hoverColor}
        isActive={isActive}
        style={{
            display: 'inline-block',
            verticalAlign: 'middle',
        }}
        width={`${size}`}
        height={`${size}`}
        viewBox="0 0 1024 1024"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onClick={onClick}
    >
        {icon.map(path => (
            <Path
                key={path}
                isActive={isActive}
                color={color}
                d={path}
            />
        ))}
    </SvgWrapper>
);

Icon.propTypes = {
    className: PropTypes.string,
    hoverColor: PropTypes.string,
    canAnimate: PropTypes.bool,
    icon: PropTypes.arrayOf(PropTypes.string).isRequired,
    size: PropTypes.number,
    isActive: PropTypes.bool,
    color: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
    onClick: PropTypes.func,
};


export default Icon;