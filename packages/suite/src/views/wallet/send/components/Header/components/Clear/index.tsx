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
    padding-right: 10px;
    color: ${colors.BLACK50};
`;

export default () => {
    const { resetContext } = useSendFormContext();

    return (
        <Wrapper>
            <In>
                <Button variant="tertiary" onClick={resetContext} data-test="clear-form">
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
