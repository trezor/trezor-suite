import React from 'react';
import styled from 'styled-components';
import { P, colors } from '@trezor/components-v2';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
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
    position: relative;
    padding-right: 200px;
`;

const StyledImage = styled(DeviceConfirmImage)`
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    max-width: 200px;
    pointer-events: none;
`;

export default ({ device }: any) => (
    <Wrapper>
        <P size="small">
            <Translation {...messages.TR_ADDRESS_MODAL_CHECK_ON_TREZOR} />
        </P>
        <P size="tiny">
            <Translation {...messages.TR_ADDRESS_MODAL_CHECK_ON_TREZOR_DESC} />
        </P>
        <StyledImage device={device} />
    </Wrapper>
);
