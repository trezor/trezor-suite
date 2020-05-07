import { CSSProperties } from 'react';
import styled from 'styled-components';
import { P, colors, variables } from '@trezor/components';

interface Props {
    style?: CSSProperties;
}

const Text = styled(P)<Props>`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

export default Text;
