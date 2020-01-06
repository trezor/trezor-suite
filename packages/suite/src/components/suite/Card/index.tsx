import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    border-radius: 6px;
    box-shadow: 0 6px 20px 0 #ebebeb;
`;

// const Header = styled.div`
//     background-color: #f5f5f5;
// `;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const Card = ({ children, ...rest }: Props) => {
    return <Wrapper {...rest}>{children}</Wrapper>;
};

export default Card;
