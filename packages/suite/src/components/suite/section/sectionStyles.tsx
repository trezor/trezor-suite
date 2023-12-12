import styled, { css } from 'styled-components';
import { Select, variables, Button, SelectProps, ButtonProps } from '@trezor/components';

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

export const ActionSelect = styled((props: SelectProps) => <Select {...props} size="small" />)`
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

export const ActionButton = styled((props: ButtonProps) => <Button {...props} size="small" />)`
    min-width: 140px;
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
