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

interface Props {
    children: React.ReactNode;
}

const Content = ({ ...props }: Props) => (
    <Wrapper>
        <WrapperWidth {...props} />
    </Wrapper>
);

export default Content;
