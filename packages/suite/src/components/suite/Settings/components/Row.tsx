import styled from 'styled-components';
import { variables } from '@trezor/components';

const { SCREEN_SIZE } = variables;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 26px 24px;

    @media all and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

export default Row;
