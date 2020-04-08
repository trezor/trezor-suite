import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    border-radius: 6px;
    background: ${colors.WHITE};
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.05);
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const Card = ({ children, ...rest }: Props) => {
    return <Wrapper {...rest}>{children}</Wrapper>;
};

export default Card;
