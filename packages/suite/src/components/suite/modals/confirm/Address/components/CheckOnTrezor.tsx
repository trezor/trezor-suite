import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    padding: 16px;
    margin: 0px 32px 32px 32px;
    text-align: left;
    background: ${props => props.theme.BG_LIGHT_GREY};
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

const CheckOnTrezor = ({ device }: any) => (
    <Wrapper>
        <P size="small">
            <Translation id="TR_ADDRESS_MODAL_CHECK_ON_TREZOR" />
        </P>
        <P size="tiny">
            <Translation id="TR_ADDRESS_MODAL_CHECK_ON_TREZOR_DESC" />
        </P>
        <StyledImage device={device} />
    </Wrapper>
);

export default CheckOnTrezor;
