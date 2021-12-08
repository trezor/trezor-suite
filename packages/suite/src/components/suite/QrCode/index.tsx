import React from 'react';
import QRCode from 'qrcode.react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 28px;
    padding: 4px; /* some qr code scanners can't recognize qr codes on dark background, having white border around helps with this */
    background: ${colors.BG_WHITE};
`;

interface Props {
    value: string;
    className?: string;
}

const QrCode = (props: Props) => (
    <Wrapper className={props.className}>
        <QRCode
            bgColor={colors.BG_WHITE}
            fgColor={colors.TYPE_DARK_GREY}
            level="Q"
            style={{ width: '80px', height: '80px' }}
            value={props.value}
        />
    </Wrapper>
);

export default QrCode;
