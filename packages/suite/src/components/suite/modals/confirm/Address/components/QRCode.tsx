import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { P } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 0px;
`;

const PathWrapper = styled.div`
    margin-top: 8px;
    width: 140px;
    text-align: left;
`;

interface Props {
    value: string;
    width?: number;
    addressPath?: string;
}

const QrCode = (props: Props) => (
    <Wrapper>
        <QRCode
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="Q"
            style={{ width: '140px' }}
            value={props.value}
        />
        {props.addressPath && (
            <PathWrapper>
                <P size="tiny">{props.addressPath}</P>
            </PathWrapper>
        )}
    </Wrapper>
);

export default QrCode;
