import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';

import { colors } from '@trezor/components';

export const QRCODE_SIZE = 384;
export const QRCODE_PADDING = 12;

const Wrapper = styled.div`
    margin: auto;
    max-height: 50vh;

    /* some qr code scanners can't recognize qr codes on dark background, having white border around helps with this */
    padding: ${QRCODE_PADDING}px;
    background: ${colors.BG_WHITE};
    max-width: ${QRCODE_SIZE}px;
`;

interface QrCodeProps {
    value: string;
    className?: string;
}

export const QrCode = ({ value, className }: QrCodeProps) => (
    <Wrapper className={className}>
        <QRCodeSVG
            bgColor={colors.BG_WHITE}
            fgColor={colors.TYPE_DARK_GREY}
            level="Q"
            size={QRCODE_SIZE}
            value={value}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
    </Wrapper>
);
