import { type ReactNode } from 'react';

import { QRCodeSVG } from 'qrcode.react';
import styled, { useTheme } from 'styled-components';

import { Flex } from '@trezor/components';
import { type Color } from '@trezor/theme';

// The center icon must stay within the error-correction budget so it never damages the encoded
// data. Capped at 25% of the QR width (~6% of its area), well below level H's ~30% recovery budget.
const QR_CENTER_ICON_MAX_RATIO = '25%';

// `translate(-50%, -50%)` centers the badge on the QR regardless of its own size, while the inner
// flex centering keeps the icon centered so the max-ratio clip stays symmetric (a plain max-width +
// overflow would clip the bottom-right and push the icon off-center).
const CenterIconWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: ${QR_CENTER_ICON_MAX_RATIO};
    max-height: ${QR_CENTER_ICON_MAX_RATIO};
    padding: 4px;
    overflow: hidden;
    line-height: 0;
    border-radius: calc(infinity * 1px);
    background: ${({ theme }) => theme.surfaceFillRaised};
    transform: translate(-50%, -50%);
`;

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
            {centerIcon && <CenterIconWrapper>{centerIcon}</CenterIconWrapper>}
        </Flex>
    );
};
