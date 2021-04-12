import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const StyledButton = styled(Button)`
    margin-right: 8px;
    padding: 0;
    background: none;
`;

const Convert = ({ onClick }: any) => (
    <Wrapper>
        <Translation
            id="RECIPIENT_FORMAT_UPPERCASE"
            isNested
            values={{
                convert: (
                    <StyledButton variant="tertiary" onClick={onClick}>
                        <Translation id="RECIPIENT_FORMAT_UPPERCASE_CONVERT" />
                    </StyledButton>
                ),
            }}
        />
    </Wrapper>
);

export default Convert;
