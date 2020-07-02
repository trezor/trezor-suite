import React from 'react';
import styled from 'styled-components';
import { SelectBar } from '@trezor/components';

import { Card, Translation } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
`;

export default () => {
    return (
        <StyledCard>
            <SelectBar
                label={<Translation id="TR_FEE" />}
                options={[
                    { label: 'low', value: 'low' },
                    { label: 'medium', value: 'medium' },
                    { label: 'high', value: 'high' },
                    { label: 'custom', value: 'custom' },
                ]}
            />
        </StyledCard>
    );
};
