import styled from 'styled-components';

import { variables } from '@trezor/components';

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
