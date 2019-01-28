import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import { FADE_IN } from 'config/animations';


const StyledBackdrop = styled.div`
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 100;
    left: 0;
    top: 0;
    background-color: rgba(0,0,0,0.5);

    ${props => props.animated && css`
        animation: ${FADE_IN} 0.3s;
    `};
`;

const Backdrop = ({
    className,
    show,
    animated,
    onClick,
}) => (
    show ? <StyledBackdrop className={className} animated={animated} onClick={onClick} /> : null
);

Backdrop.propTypes = {
    show: PropTypes.bool.isRequired,
    className: PropTypes.string,
    animated: PropTypes.bool,
    onClick: PropTypes.func,
};

export default Backdrop;
