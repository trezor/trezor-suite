import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { variables, Image } from '@trezor/components';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 32px;
`;

const AmomymizedMessage = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const AnonymizedIndicator = () => (
    <Container>
        <Image image="CHECK_SHIELD" width={90} />
        <AmomymizedMessage>
            <Translation id="TR_ALL_FUNDS_ANONYMIZED" />
        </AmomymizedMessage>
    </Container>
);
