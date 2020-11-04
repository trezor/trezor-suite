import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 28px;
`;

interface Props {
    value: string;
}

const QrCode = (props: Props) => (
    <Wrapper>
        <QRCode
            bgColor={colors.BG_WHITE}
            fgColor={colors.TYPE_DARK_GREY}
            level="Q"
            style={{ width: '80px' }}
            value={props.value}
        />
    </Wrapper>
);

export default QrCode;
