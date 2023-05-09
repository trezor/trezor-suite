import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    position: absolute;
    top: -3px;
    right: -10px;
`;

const DotWrapper = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.theme.BG_WHITE};
`;

const In = styled.div`
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.theme.TYPE_GREEN};
`;

export const Dot = () => (
    <Wrapper>
        <DotWrapper>
            <In />
        </DotWrapper>
    </Wrapper>
);
