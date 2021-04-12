import React from 'react';
import styled from 'styled-components';
import { Input, InputProps, Select, variables, Button } from '@trezor/components';

const { SCREEN_SIZE } = variables;

export const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    flex-wrap: wrap;
`;

// found no better way how to style Input..
const InputWrapper = styled.div`
    margin: 4px;
    width: 100%;
    @media all and (min-width: ${SCREEN_SIZE.SM}) {
        width: 170px;
    }
`;

export const ActionInput = (props: InputProps) => (
    <InputWrapper>
        <Input {...props} />
    </InputWrapper>
);

export const ActionSelect = styled(Select)`
    width: 170px;
    margin: 4px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

export const ActionButton = styled(Button)`
    min-width: 170px;
    margin: 4px;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;
