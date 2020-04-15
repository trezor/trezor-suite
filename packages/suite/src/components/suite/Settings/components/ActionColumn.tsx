import styled from 'styled-components';
import { Input, Select, variables, Button } from '@trezor/components';

const { SCREEN_SIZE } = variables;

export const ActionColumn = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    flex-wrap: wrap;
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
    margin: 4px;

    @media screen and (max-width: ${SCREEN_SIZE.SM}) {
        min-width: 100%;
    }
`;
