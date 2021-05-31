import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100%;
    overflow-y: auto;
    padding: 0 22px;
`;

interface Props {
    children: React.ReactNode;
}

const Content = ({ ...props }: Props) => <Wrapper {...props} />;

export default Content;
