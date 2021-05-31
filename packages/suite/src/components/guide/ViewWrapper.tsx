import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    flex-direction: column;
    height: 100%;
`;

interface Props {
    children: React.ReactNode;
}

const ViewWrapper = ({ children, ...rest }: Props) => <Wrapper {...rest}>{children}</Wrapper>;

export default ViewWrapper;
