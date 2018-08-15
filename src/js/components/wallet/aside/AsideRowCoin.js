
import styled from 'styled-components';
import React from 'react';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    display: block;
    height: 50px;

    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const AsideRowCoin = ({ children }) => (
    <Wrapper>
        {children}
    </Wrapper>
);

export default AsideRowCoin;
