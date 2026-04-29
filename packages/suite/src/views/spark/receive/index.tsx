import { SparkReceiveView } from '@suite-common/spark';
import { Box } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { QrCode } from 'src/components/suite/QrCode';

import { SparkLayout } from '../SparkLayout';
import { useSparkWallet } from '../useSparkWallet';

export const SparkReceive = () => {
    const { refreshLightningInvoice, wallet } = useSparkWallet();

    return (
        <SparkLayout>
            {wallet && (
                <SparkReceiveView
                    bitcoinDepositAddress={wallet.bitcoinDepositAddress}
                    lightningInvoice={wallet.lightningInvoice}
                    lightningQrCode={
                        <Box
                            height={160}
                            width={160}
                            padding={4}
                            backgroundColor="surfaceFillRaised"
                        >
                            <QrCode value={wallet.lightningInvoice} />
                        </Box>
                    }
                    onCopyBitcoinAddress={() => copyToClipboard(wallet.bitcoinDepositAddress)}
                    onCopyLightningInvoice={() => copyToClipboard(wallet.lightningInvoice)}
                    onRefreshLightningInvoice={refreshLightningInvoice}
                />
            )}
        </SparkLayout>
    );
};
