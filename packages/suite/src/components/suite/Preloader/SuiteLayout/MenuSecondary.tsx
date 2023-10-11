import { ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';

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

interface MenuSecondaryProps {
    children: ReactNode;
}

export const MenuSecondary = ({ children }: MenuSecondaryProps) => (
    <AbsoluteWrapper>
        <Wrapper>{children}</Wrapper>
    </AbsoluteWrapper>
);
