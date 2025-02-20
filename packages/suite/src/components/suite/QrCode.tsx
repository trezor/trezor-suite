import { QRCodeSVG } from 'qrcode.react';
import styled, { css } from 'styled-components';

import { borders, palette, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    ${({ theme }) =>
        theme.variant === 'dark' &&
        css`
            padding: ${spacingsPx.xs};
            border-radius: ${borders.radii.xs};
            background-color: ${palette.lightWhiteAlpha1000};
        `}
`;

type QrCodeProps = {
    value: string;
};

export const QrCode = ({ value }: QrCodeProps) => (
    <Wrapper>
        <QRCodeSVG
            bgColor="transparent"
            fgColor={palette.lightGray1000}
            level="Q"
            value={value}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
    </Wrapper>
);
