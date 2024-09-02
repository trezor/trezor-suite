import { ReactNode } from 'react';
import styled from 'styled-components';
import { Card, Column } from '@trezor/components';

// eslint-disable-next-line local-rules/no-override-ds-component
const Wrapper = styled(Card)`
    text-align: left;
    background-color: ${({ theme }) => theme.legacy.BG_GREY};
    margin-left: -10px;
    margin-right: -10px;
    margin-top: 12px;
`;

export const GreyCard = (props: { children?: ReactNode }) => (
    <Wrapper>
        <Column>{props.children}</Column>
    </Wrapper>
);
