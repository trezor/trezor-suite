import { variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

interface Props {
    children: React.ReactNode;
}

const AbsoluteWrapper = styled.aside`
    width: ${variables.LAYOUT_SIZE.MENU_SECONDARY_WIDTH};
    flex: 0 0 auto;
    background: ${({ theme }) => theme.BG_WHITE};
    border-right: 1px solid ${({ theme }) => theme.STROKE_GREY};
    height: 100%;
    overflow: auto;
`;

const Wrapper = styled.div`
    height: 100%;
    display: flex;
`;

const MenuSecondary = ({ children }: Props) => (
    <AbsoluteWrapper>
        <Wrapper>{children}</Wrapper>
    </AbsoluteWrapper>
);

export default MenuSecondary;
