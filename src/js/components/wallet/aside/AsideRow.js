import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import colors from 'config/colors';
import { TRANSITION_TIME } from 'config/variables';

const Wrapper = styled.div`
    padding: 16px 24px;

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

const AsideRow = ({ children, column = false }) => (
    <Wrapper
        column={column}
    >{children}
    </Wrapper>
);

AsideRow.propTypes = {
    column: PropTypes.bool,
};

export default AsideRow;
