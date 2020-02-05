import { variables } from '@trezor/components-v2';
import styled from 'styled-components';

interface Props {
    padding?: string;
}

const ModalWrapper = styled.div<Props>`
    display: flex;
    flex-direction: row;
    padding: ${props => props.padding || '40px'};

    /* @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 20px;
    } */
`;

export default ModalWrapper;
