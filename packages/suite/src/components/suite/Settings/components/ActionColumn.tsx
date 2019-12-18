import styled from 'styled-components';
import { Input, Select, variables } from '@trezor/components';
import { Button } from '@trezor/components-v2';

const { SCREEN_SIZE } = variables;

export const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

export const ActionInput = styled(Input)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

export const ActionSelect = styled(Select)`
    width: 170px;
    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;

export const ActionButton = styled(Button)`
    min-width: 170px;
    margin-left: 10px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
        margin: 5px 0;
    }
`;
