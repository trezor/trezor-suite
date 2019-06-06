import { CSSProperties } from 'react';
import styled from 'styled-components';

import { P } from '@trezor/components';

interface Props {
    style?: CSSProperties;
}

const Text = styled(P)<Props>`
    margin-bottom: 10px;
    text-align: center;
`;

export default Text;
