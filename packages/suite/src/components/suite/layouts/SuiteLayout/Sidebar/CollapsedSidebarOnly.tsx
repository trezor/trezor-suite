import React from 'react';
import styled from 'styled-components';
import { isExpandedSidebar } from './consts';

const Container = styled.div`
    @container ${isExpandedSidebar} {
        display: none;
    }
`;

type Props = {
    children: React.ReactNode;
};

export const CollapsedSidebarOnly = ({ children }: Props) => {
    return <Container>{children}</Container>;
};
