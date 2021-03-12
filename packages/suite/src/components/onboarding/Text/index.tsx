import styled from 'styled-components';
import { variables } from '@trezor/components';

const Text = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export default Text;
