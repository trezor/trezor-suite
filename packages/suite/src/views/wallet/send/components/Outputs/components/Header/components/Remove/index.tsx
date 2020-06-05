import { Translation } from '@suite-components/Translation';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { colors, Icon, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

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
}

export default ({ outputId }: Props) => {
    const { updateOutputs, outputs } = useSendContext();

    return (
        <Wrapper
            onClick={() => {
                const filteredOutputs = outputs.filter(output => output.id !== outputId);
                updateOutputs(filteredOutputs);
            }}
        >
            <StyledIcon size={12} color={colors.BLACK50} icon="CLEAR" />
            <Translation id="TR_REMOVE" />
        </Wrapper>
    );
};
