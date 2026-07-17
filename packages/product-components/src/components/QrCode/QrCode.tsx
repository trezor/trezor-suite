import { type ReactNode } from 'react';

import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from 'styled-components';

import { Box, Flex } from '@trezor/components';
import { type Color } from '@trezor/theme';

// The center icon must stay within the error-correction budget so it never damages the encoded
// data. Capped at 25% of the QR width (~6% of its area), well below level H's ~30% recovery budget.
const QR_CENTER_ICON_MAX_RATIO = '25%';

export type QrCodeProps = {
    value: string;
    color?: Color;
    centerIcon?: ReactNode;
};

export const QrCode = ({ value, color = 'contentPrimary', centerIcon }: QrCodeProps) => {
    const theme = useTheme();

    return (
        <Flex position={{ type: 'relative' }} width="100%" height="100%">
            <QRCodeSVG
                fgColor={theme[color]}
                bgColor="transparent"
                level={centerIcon ? 'H' : 'Q'}
                value={value}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {centerIcon && (
                <Box
                    position={{ type: 'absolute', inset: 0 }}
                    margin="auto"
                    width="fit-content"
                    height="fit-content"
                    maxWidth={QR_CENTER_ICON_MAX_RATIO}
                    maxHeight={QR_CENTER_ICON_MAX_RATIO}
                    padding={4}
                    borderRadius="full"
                    overflow="hidden"
                    backgroundColor="surfaceFillRaised"
                >
                    {centerIcon}
                </Box>
            )}
        </Flex>
    );
};
