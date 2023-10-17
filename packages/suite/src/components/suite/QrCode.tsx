import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';

import { Icon, colors, variables } from '@trezor/components';
import { Translation } from './Translation';

export const QRCODE_SIZE = 384;
export const QRCODE_PADDING = 12;

const Wrapper = styled.div`
    margin: auto;
    max-height: 50vh;

    /* some qr code scanners can't recognize qr codes on dark background, having white border around helps with this */
    padding: ${QRCODE_PADDING}px;
    background: ${colors.BG_WHITE};
    max-width: ${QRCODE_SIZE}px;
    position: relative;
`;

const MessageWrapper = styled.div`
    display: flex;
    gap: 6px;
    position: absolute;
    left: 50%;
    bottom: 9px;
    transform: translate(-50%, 0);
    width: 100%;
    align-items: center;
    justify-content: center;
`;

const Message = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface QrCodeProps {
    value: string;
    className?: string;
    showMessage?: boolean;
    bgColor?: string;
    fgColor?: string;
}

export const QrCode = ({ value, className, bgColor, fgColor, showMessage }: QrCodeProps) => (
    <Wrapper className={className}>
        <QRCodeSVG
            bgColor={bgColor || colors.BG_WHITE}
            fgColor={fgColor || colors.TYPE_DARK_GREY}
            level="Q"
            size={QRCODE_SIZE}
            value={value}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {showMessage && (
            <MessageWrapper>
                <Message>
                    <Translation id="TR_QR_RECEIVE_ADDRESS_CONFIRM" />
                </Message>
                <Icon icon="INFO" size={12} color={fgColor || colors.TYPE_DARK_GREY} />
            </MessageWrapper>
        )}
    </Wrapper>
);
