import React from 'react';
import styled, { css } from 'styled-components';
import { Input, InputProps, Select, variables, Button } from '@trezor/components';

const { SCREEN_SIZE } = variables;

export const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    flex-wrap: wrap;

    @media (max-width: ${SCREEN_SIZE.SM}) {
        justify-content: flex-start;
        margin-top: 10px;
    }
`;

const InputWrapper = styled.div`
    margin: 4px 0 4px 4px;
    width: 210px;

    &:not(:first-child) {
        margin-left: 8px;
    }

    @media (max-width: ${SCREEN_SIZE.SM}) {
        margin: 0px 0 10px;
        width: 100%;
    }
`;

export const ActionInput = (props: InputProps) => (
    <InputWrapper>
        <Input {...props} />
    </InputWrapper>
);

export const ActionSelect = styled(Select)`
    width: 170px;
    margin: 4px 0 4px 4px;
    &:not(:first-child) {
        margin-left: 8px;
    }
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

export const ActionButton = styled(Button)<{ isDisabled?: boolean }>`
    min-width: 170px;
    margin: 4px 0 4px 4px;
    &:not(:first-child) {
        margin-left: 8px;

        @media (max-width: ${SCREEN_SIZE.SM}) {
            margin-left: 0;
        }
    }

    @media (max-width: ${SCREEN_SIZE.SM}) {
        width: 100%;
        margin: 0;
    }

    ${props =>
        props.isDisabled &&
        css`
            cursor: not-allowed;
        `}
`;
