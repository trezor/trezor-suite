import React from 'react';
import styled from 'styled-components';
import { H3 } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { AnonymityLevelSetup } from '@wallet-components/PrivacyAccount/AnonymityLevelSetup';

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
`;

export const SummaryHeader = () => (
    <Row>
        <H3>
            <Translation id="TR_MY_COINS" />
        </H3>

        <AnonymityLevelSetup />
    </Row>
);
