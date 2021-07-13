import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100%;
    padding: 15px 22px 0;
`;

interface Props {
    children: React.ReactNode;
}

const Content = ({ ...props }: Props) => <Wrapper {...props} />;

export default Content;
