import React from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    width: 100%;
    height: 8px;
    display: flex;
    justify-content: flex-end;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const CornerBg = styled.div`
    position: absolute;
    height: 8px;
    width: 8px;
    background: ${colors.BACKGROUND};
`;

const Corner = styled.div<{ top?: boolean; bottom?: boolean }>`
    height: 8px;
    position: relative;
    width: 8px;
    background: ${colors.BLACK17};

    ${props =>
        props.top &&
        css`
            border-bottom-right-radius: 6px;
        `}

    ${props =>
        props.bottom &&
        css`
            border-top-right-radius: 6px;
        `}
`;

interface Props {
    top?: boolean;
    bottom?: boolean;
    isActive?: boolean;
}

export default ({ top, bottom, isActive }: Props) => {
    if (!isActive) return null;

    return (
        <Wrapper>
            <CornerBg />
            <Corner top={top} bottom={bottom} />
        </Wrapper>
    );
};
