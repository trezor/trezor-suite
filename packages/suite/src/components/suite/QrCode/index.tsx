import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { P, colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 0px 32px 0px;
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
            bgColor={colors.WHITE}
            fgColor={colors.BLACK0}
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
