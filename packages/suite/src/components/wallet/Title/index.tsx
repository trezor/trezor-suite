import * as React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

interface OwnProps {
    children?: React.ReactNode;
    className?: string;
}

const Wrapper = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: ${variables.FONT_SIZE.WALLET_TITLE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-bottom: 35px;
`;

const Title = ({ children, className }: OwnProps) => (
    <Wrapper className={className}>{children}</Wrapper>
);

export default Title;
