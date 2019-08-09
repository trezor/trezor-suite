import styled from 'styled-components';
import React, { ReactNode } from 'react';

import { variables } from '@trezor/components';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: ${variables.TRANSITION.HOVER};
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode | ReactNode[];
}

const Row = ({ children, ...rest }: Props) => <Wrapper {...rest}>{children}</Wrapper>;

export default Row;
