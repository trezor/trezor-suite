import React from 'react';
import styled from 'styled-components';
import { H3 } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

const Heading = styled(H3)`
    margin-bottom: 28px;
`;

export const SummaryHeader = () => (
    <Heading>
        <Translation id="TR_MY_COINS" />
    </Heading>
);
