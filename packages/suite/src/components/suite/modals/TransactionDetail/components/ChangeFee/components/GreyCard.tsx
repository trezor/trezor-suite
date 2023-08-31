import { ReactNode } from 'react';
import styled from 'styled-components';
import { Card } from '@trezor/components';

const Wrapper = styled(Card)`
    display: flex;
    flex-direction: column;
    text-align: left;
    background-color: ${({ theme }) => theme.BG_GREY};
    margin-left: -10px;
    margin-right: -10px;
    margin-top: 12px;
`;

export const GreyCard = (props: { children?: ReactNode }) => <Wrapper>{props.children}</Wrapper>;
