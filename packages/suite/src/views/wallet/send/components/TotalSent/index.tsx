import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import { Card, Translation } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const Label = styled.div`
    padding-right: 10px;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const SecondaryLabel = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

export default () => {
    return (
        <StyledCard>
            <Label>
                <Translation id="TR_TOTAL_SENT" />
            </Label>
            <SecondaryLabel>
                <Translation id="TR_INCLUDING_FEE" />
            </SecondaryLabel>
        </StyledCard>
    );
};
