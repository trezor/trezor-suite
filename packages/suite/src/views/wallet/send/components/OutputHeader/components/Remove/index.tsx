import React from 'react';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import styled from 'styled-components';
import { Icon, colors, variables } from '@trezor/components';
import { DispatchProps } from '../../../../Container';

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
    sendFormActionsBitcoin: DispatchProps['sendFormActionsBitcoin'];
}

export default ({ sendFormActionsBitcoin, outputId }: Props) => (
    <Wrapper onClick={() => sendFormActionsBitcoin.removeRecipient(outputId)}>
        <StyledIcon size={12} color={colors.BLACK50} icon="CLEAR" />
        <Translation {...messages.TR_REMOVE} />
    </Wrapper>
);
