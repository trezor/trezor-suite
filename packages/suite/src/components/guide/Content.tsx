import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';

const Wrapper = styled.div`
    height: 100%;
    padding: 15px 22px 0;
`;

const WrapperWidth = styled.div`
    width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_CONTENT_WIDTH};
`;

type ContentProps = {
    children: React.ReactNode;
};

export const Content = ({ children }: ContentProps) => (
    <Wrapper>
        <WrapperWidth>{children}</WrapperWidth>
    </Wrapper>
);
