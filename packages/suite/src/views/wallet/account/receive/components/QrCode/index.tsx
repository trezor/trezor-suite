import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import messages from './messages';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;
    flex-direction: column;
`;

const StyledQRCode = styled(QRCode)`
    /* padding: 15px;
    border: 1px solid ${colors.BODY}; */
`;

const Label = styled.div`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const PathWrapper = styled.div`
    margin-top: 10px;
    color: ${colors.TEXT_PRIMARY};
`;

const PathType = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;
const PathValue = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
`;

interface Props {
    value: string;
    title?: string | React.ReactNode;
    width?: number;
    accountPath: string;
}

const QrCode = (props: Props) => (
    <Wrapper>
        <Label>{props.title || <Translation {...messages.TR_QR_CODE} />}</Label>
        <StyledQRCode
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="Q"
            style={{ width: `${props.width || 150}px` }}
            value={props.value}
        />
        {props.accountPath && (
            <PathWrapper>
                <PathType>BIP32 Path:</PathType>
                <PathValue>{props.accountPath}</PathValue>
            </PathWrapper>
        )}
    </Wrapper>
);

export default QrCode;
