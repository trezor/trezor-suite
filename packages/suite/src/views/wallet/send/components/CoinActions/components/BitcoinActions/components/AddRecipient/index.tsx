import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
`;

export default () => {
    const { addOutput } = useSendFormContext();
    return (
        <Wrapper>
            <Button
                variant="tertiary"
                icon="PLUS"
                onClick={() => {
                    addOutput({
                        address: '',
                        amount: '',
                        fiat: '',
                        currency: undefined,
                    });
                }}
            >
                <Translation id="TR_ANOTHER_RECIPIENT" />
            </Button>
        </Wrapper>
    );
};
