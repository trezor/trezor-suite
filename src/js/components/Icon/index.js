import React from 'react';
import PropTypes from 'prop-types';
import styled, { css, keyframes } from 'styled-components';

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
    animation: ${props => (props.isActive ? rotate180up : rotate180down)} 0.2s linear 1 forwards;
`;

const Path = styled.path``;

const Icon = ({
    icon, size = 32, color = 'black', isActive = false,
}) => {
    const styles = {
        svg: {
            display: 'inline-block',
            verticalAlign: 'middle',
        },
        path: {
            fill: color,
        },
    };

    return (
        <SvgWrapper
            isOpen={isOpen}
            style={styles.svg}
            width={`${size}`}
            height={`${size}`}
            viewBox="0 0 1024 1024"
        >
            <Path
                isActive={isActive}
                style={styles.path}
                d={icon}

            />
        </SvgWrapper>
    );
};

Icon.propTypes = {
    icon: PropTypes.string.isRequired,
    size: PropTypes.number,
    isActive: PropTypes.bool,
    color: PropTypes.string,
};


export default Icon;