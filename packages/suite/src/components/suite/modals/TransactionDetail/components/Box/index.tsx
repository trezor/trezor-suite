
import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';

const COLOR_BORDER = colors.BLACK96;

const Box = styled.div`
    border-radius: 3px;
    border: solid 2px ${COLOR_BORDER};

    & + & {
        margin-top: 20px;
    }
`;

export default Box;
