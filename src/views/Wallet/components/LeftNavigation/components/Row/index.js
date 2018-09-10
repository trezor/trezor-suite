import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import { TRANSITION } from 'config/variables';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: ${TRANSITION.HOVER};
`;

const Row = ({
    children, onClick, onMouseEnter, onMouseLeave, onFocus,
}) => (
    <Wrapper
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
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
};

export default Row;
