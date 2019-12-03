import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
`;

const Line = styled.div`
    margin: 5px 0;
    height: 2px;
    opacity: 0.1;
    width: 100%;
    background: ${colors.BLACK96};
`;

const Divider = () => (
    <Wrapper>
        <Line />
    </Wrapper>
);

export default Divider;
