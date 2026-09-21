import { TokenIcon } from '@suite-native/icons';
import { QRCode } from '@suite-native/qr-code';

import { RECEIVE_QR_CODE_PADDING } from './ReceiveQRCodeCard.styles';
import type { ReceiveQRCodeContentProps } from './ReceiveQRCodeCard.types';

export const ReceiveQRCodeContent = ({
    address,
    networkSymbol,
    tokenContract,
    tokenSymbol,
    qrCodeSize,
}: ReceiveQRCodeContentProps) => (
    <QRCode
        data={address}
        qrCodeSize={qrCodeSize}
        paddingHorizontal={RECEIVE_QR_CODE_PADDING}
        paddingVertical={RECEIVE_QR_CODE_PADDING}
        centerIcon={
            <TokenIcon
                networkSymbol={networkSymbol}
                contractAddress={tokenContract}
                tokenSymbol={tokenSymbol}
                showNetworkIcon={tokenContract !== undefined}
                size="large"
            />
        }
    />
);
