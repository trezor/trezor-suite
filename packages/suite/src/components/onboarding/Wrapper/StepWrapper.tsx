import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
`;

interface Props {
    children: React.ReactNode;
    ['data-test']?: string;
}

const StepWrapper = ({ children, ...props }: Props) => <Wrapper {...props}>{children}</Wrapper>;

export default StepWrapper;
