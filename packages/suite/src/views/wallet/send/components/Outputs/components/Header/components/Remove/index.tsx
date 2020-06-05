import React from 'react';
import { Translation } from '@suite-components/Translation';

import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-top: 1px;
    margin-right: 1ch;
`;

interface Props {
    outputId: number;
    removeOutput: (id: number) => {};
}

export default ({ removeOutput, outputId }: Props) => (
    <Wrapper onClick={() => removeOutput(outputId)}>
        <StyledIcon size={12} color={colors.BLACK50} icon="CLEAR" />
        <Translation id="TR_REMOVE" />
    </Wrapper>
);
