import styled from 'styled-components';
import React from 'react';

import colors from 'config/colors';
import { FONT_SIZE, TRANSITION_TIME } from 'config/variables';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 16px 24px;

    cursor: pointer;
    font-size: ${FONT_SIZE.BASE};

    transition: background-color ${TRANSITION_TIME.BASE}, color ${TRANSITION_TIME.BASE};

    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const AsideRow = (props) => (
    <Wrapper>
        {props.children}
    </Wrapper>
);

export default AsideRow;
