import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import Row from './Row';

const StyledRow = styled(Row)`
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const SectionItem = ({ children, ...rest }: Props) => <StyledRow {...rest}>{children}</StyledRow>;

export default SectionItem;
