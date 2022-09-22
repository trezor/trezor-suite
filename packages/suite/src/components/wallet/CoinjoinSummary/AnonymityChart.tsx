import React from 'react';
import styled from 'styled-components';
import { CollapsibleBox } from '@trezor/components';
import { TooltipSymbol, Translation } from '@suite-components';

const StyledCollapsibleBox = styled(CollapsibleBox)`
    border-radius: 12px;
    background: ${({ theme }) => theme.BG_WHITE};
    box-shadow: none;

    > :first-child {
        padding: 18px 24px;
    }
`;

const BoxHeading = styled.div`
    display: flex;
    align-items: center;
`;

export const AnonymityChart = () => (
    <StyledCollapsibleBox
        heading={
            <BoxHeading>
                <Translation id="TR_COINS_ANONYMITY" />
                <TooltipSymbol content={<Translation id="TR_COINS_ANONYMITY_TOOLTIP" />} />
            </BoxHeading>
        }
        variant="large"
    >
        HELLOW 🔫🤠🔫
    </StyledCollapsibleBox>
);
