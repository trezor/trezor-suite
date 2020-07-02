import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div``;

export default () => {
    const { outputs, updateContext } = useSendFormContext().sendContext;

    return (
        <Wrapper>
            <Button
                variant="tertiary"
                icon="PLUS"
                onClick={() => {
                    const lastOutput = outputs[outputs.length - 1];
                    const outputsWithNewItem = [
                        ...outputs,
                        {
                            id: lastOutput.id + 1,
                        },
                    ];
                    updateContext({ outputs: outputsWithNewItem });
                }}
            >
                <Translation id="TR_ANOTHER_RECIPIENT" />
            </Button>
        </Wrapper>
    );
};
