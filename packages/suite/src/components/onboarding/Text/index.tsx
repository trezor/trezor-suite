import { CSSProperties } from 'react';
import styled from 'styled-components';
import { P, variables } from '@trezor/components';

interface Props {
    style?: CSSProperties;
}

const Text = styled(P)<Props>`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

export default Text;
