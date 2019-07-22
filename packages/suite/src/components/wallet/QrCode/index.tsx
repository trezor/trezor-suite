import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

const StyledQRCode = styled(QRCode)`
    padding: 15px;
    margin-top: 0 25px;
    border: 1px solid ${colors.BODY};
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.div``;

interface Props {
    value: string;
    title?: string | React.ReactNode;
    width?: number;
}

const QrCode = (props: Props) => (
    <Wrapper>
        <Label>{props.title || <FormattedMessage {...messages.TR_QR_CODE} />}</Label>
        <StyledQRCode
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="Q"
            style={{ width: `${props.width || 150}` }}
            value={props.value}
        />
    </Wrapper>
);

export default QrCode;
