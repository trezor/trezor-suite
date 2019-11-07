import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.button`
    border: 1px solid red;
`;

const Button = () => {
    return <Wrapper>I am the first button hello :)</Wrapper>;
};

export { Button };
