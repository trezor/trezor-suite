import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const In = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
`;

export default () => {
    const { resetFormContext, sendContext } = useSendFormContext();

    return (
        <Wrapper>
            <In
                onClick={() => {
                    resetFormContext();
                    sendContext.resetContext();
                }}
            >
                <Button variant="tertiary" icon="CLEAR" alignIcon="left">
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
