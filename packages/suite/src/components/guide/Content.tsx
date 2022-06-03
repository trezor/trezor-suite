import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100%;
    padding: 15px 21px 0;
`;

type ContentProps = {
    children: React.ReactNode;
};

export const Content = ({ children }: ContentProps) => <Wrapper>{children}</Wrapper>;
