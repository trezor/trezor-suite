import React from 'react';
import styled from 'styled-components';
import { P, colors } from '@trezor/components-v2';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    padding: 16px;
    margin: 0px 32px;
    margin-bottom: 40px;
    text-align: left;
    background: ${colors.BLACK96};
`;

export default () => (
    <Wrapper>
        <P size="small">
            <Translation {...messages.TR_ADDRESS_MODAL_CHECK_ON_TREZOR} />
        </P>
        <P size="tiny">
            <Translation {...messages.TR_ADDRESS_MODAL_CHECK_ON_TREZOR_DESC} />
        </P>
    </Wrapper>
);
