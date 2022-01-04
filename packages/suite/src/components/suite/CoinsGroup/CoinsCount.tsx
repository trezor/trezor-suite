import React from 'react';
import { variables } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    margin-bottom: 27px;
    align-self: flex-start;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: lowercase;
`;

interface Props {
    active: number;
    total: number;
    label: React.ReactNode;
}

const CoinsCount = ({ active, total, label }: Props) => (
    <Wrapper>
        {total} {label}
        {' • '}
        {active} <Translation id="TR_ACTIVE" />
    </Wrapper>
);

export default CoinsCount;
