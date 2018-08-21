import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import { TRANSITION_TIME } from 'config/variables';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color ${TRANSITION_TIME.BASE} ease-in-out, color ${TRANSITION_TIME.BASE} ease-in-out, border-color ${TRANSITION_TIME.BASE} ease-in-out;

    ${props => props.disabled && css`
        cursor: not-allowed;
    `}
`;

const Row = ({
    children, disabled = false, onClick, onMouseEnter, onMouseLeave, onFocus,
}) => (
    <Wrapper
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
    >
        {children}
    </Wrapper>
);

Row.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
};

export default Row;
