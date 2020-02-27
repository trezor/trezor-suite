import { variables } from '@trezor/components';
import styled from 'styled-components';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    padding?: string;
}

const ModalWrapper = styled.div<Props>`
    display: flex;
    flex-direction: row;
    overflow-y: auto;
    padding: ${props => props.padding || '40px'};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 4px;
    }
`;

export default ModalWrapper;
