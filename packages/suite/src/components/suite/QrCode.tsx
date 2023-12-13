import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';

import { Icon, Tooltip, colors, variables } from '@trezor/components';
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

    display: flex;
    flex-direction: column;
`;

const Message = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-top: 12px;
    white-space: nowrap;
`;

const StyledIcon = styled(Icon)`
    display: inline-block;
    margin-left: 5px;
    vertical-align: middle;
`;

const SpanToResetWhitespace = styled.span`
    white-space: normal;
`;

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
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
            <Message>
                <SpanToResetWhitespace>
                    <Translation id="TR_QR_RECEIVE_ADDRESS_CONFIRM" />
                </SpanToResetWhitespace>
                <StyledTooltip
                    content={<Translation id="TR_QR_RECEIVE_ADDRESS_CONFIRM_EXPLANATION" />}
                >
                    <StyledIcon icon="INFO" size={12} color={fgColor || colors.TYPE_DARK_GREY} />
                </StyledTooltip>
            </Message>
        )}
    </Wrapper>
);
