import React from 'react';
import styled from 'styled-components';
import { isCollapsedSidebar } from './consts';

const Container = styled.div`
    @container ${isCollapsedSidebar} {
        display: none;
    }
`;

type Props = {
    children: React.ReactNode;
};

export const ExpandedSidebarOnly = ({ children }: Props) => {
    return <Container>{children}</Container>;
};
