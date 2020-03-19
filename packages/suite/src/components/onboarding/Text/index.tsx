import { CSSProperties } from 'react';
import styled from 'styled-components';
import { P, colors } from '@trezor/components';

interface Props {
    style?: CSSProperties;
}

const Text = styled(P)<Props>`
    color: ${colors.BLACK50};
`;

export default Text;
