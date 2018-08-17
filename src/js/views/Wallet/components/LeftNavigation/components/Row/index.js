import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import { TRANSITION_TIME } from 'config/variables';

const Wrapper = styled.div`
    height: 100%;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    ${props => props.column && css`
        flex-direction: column;
        align-items: flex-start;
    `}

    cursor: pointer;
    transition: background-color ${TRANSITION_TIME.BASE}, color ${TRANSITION_TIME.BASE};
`;

const Row = ({
    children, column = false,
}) => (
    <Wrapper
        column={column}
    >{children}
    </Wrapper>
);

Row.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    column: PropTypes.bool,
};

export default Row;
