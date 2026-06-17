import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from 'styled-components';

import { Row } from '@trezor/components';
import { type Color } from '@trezor/theme';

type QrCodeProps = {
    value: string;
    color?: Color;
};

export const QrCode = ({ value, color = 'contentPrimary' }: QrCodeProps) => {
    const theme = useTheme();

    return (
        <Row justifyContent="center" alignItems="center" width="100%" height="100%">
            <QRCodeSVG
                fgColor={theme[color]}
                bgColor="transparent"
                level="Q"
                value={value}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        </Row>
    );
};
