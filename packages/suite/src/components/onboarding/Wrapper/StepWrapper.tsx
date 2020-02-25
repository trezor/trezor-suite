import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 520px;
    overflow-y: auto;
`;

interface Props {
    children: React.ReactNode;
    ['data-test']?: string;
}
export default ({ children, ...props }: Props) => <Wrapper {...props}>{children}</Wrapper>;
