import { Box } from '@suite-native/atoms';
import { QRCode } from '@suite-native/qr-code';
import { TokenIcon } from '@suite-native/tokens';

import { RECEIVE_QR_CODE_PADDING } from './ReceiveQRCodeCard.styles';
import type { ReceiveQRCodeContentProps } from './ReceiveQRCodeCard.types';

export const ReceiveQRCodeContent = ({
    address,
    networkSymbol,
    tokenContract,
    qrCodeSize,
}: ReceiveQRCodeContentProps) => (
    <QRCode
        data={address}
        qrCodeSize={qrCodeSize}
        paddingHorizontal={RECEIVE_QR_CODE_PADDING}
        paddingVertical={RECEIVE_QR_CODE_PADDING}
        centerIcon={
            <Box collapsable={false} testID="@receive/qr-code-token-icon">
                <TokenIcon
                    networkSymbol={networkSymbol}
                    contractAddress={tokenContract}
                    showNetworkIcon={tokenContract !== undefined}
                    size="large"
                />
            </Box>
        }
    />
);
