import React from 'react';
import QRCode from 'qrcode.react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Wrapper = styled.div`
    margin: 0 auto 28px;
    padding: 4px; /* some qr code scanners can't recognize qr codes on dark background, having white border around helps with this */
    background: ${colors.BG_WHITE};
`;

interface Props {
    value: string;
    className?: string;
    size?: number;
    width?: string | number;
    height?: string | number;
}

const QrCode = ({ className, value, size, width, height }: Props) => (
    <Wrapper className={className}>
        <QRCode
            bgColor={colors.BG_WHITE}
            fgColor={colors.TYPE_DARK_GREY}
            level="Q"
            size={size}
            style={{ width, height }}
            value={value}
        />
    </Wrapper>
);

export default QrCode;
