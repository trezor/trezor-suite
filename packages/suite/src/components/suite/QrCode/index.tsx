import React from 'react';
import QRCode from 'qrcode.react';
import styled from 'styled-components';

import { colors, variables } from '@trezor/components';

export const QRCODE_SIZE = 384;
export const QRCODE_PADDING = 12;

const Wrapper = styled.div`
    margin: 0 auto 20px;

    /* some qr code scanners can't recognize qr codes on dark background, having white border around helps with this */
    padding: ${QRCODE_PADDING}px;
    background: ${colors.BG_WHITE};
    width: ${QRCODE_SIZE}px;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

interface QrCodeProps {
    value: string;
}

export const QrCode = ({ value }: QrCodeProps) => (
    <Wrapper>
        <QRCode
            bgColor={colors.BG_WHITE}
            fgColor={colors.TYPE_DARK_GREY}
            level="Q"
            size={QRCODE_SIZE}
            value={value}
            style={{ width: '100%', height: 'auto' }}
        />
    </Wrapper>
);
