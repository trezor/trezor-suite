import { useEffect } from 'react';

import { SparkReceiveView } from '@suite-common/spark';
import { Box } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { QrCode } from 'src/components/suite/QrCode';

import { SparkLayout } from '../SparkLayout';
import { useSparkWallet } from '../useSparkWallet';

export const SparkReceive = () => {
    const { refreshLightningInvoice, wallet } = useSparkWallet();

    useEffect(() => {
        if (!wallet) {
            return;
        }

        if (wallet.bitcoinDepositAddress !== '' && wallet.lightningInvoice !== '') {
            return;
        }

        refreshLightningInvoice();
    }, [refreshLightningInvoice, wallet]);

    return (
        <SparkLayout>
            {wallet && (
                <SparkReceiveView
                    bitcoinDepositAddress={wallet.bitcoinDepositAddress}
                    lightningInvoice={wallet.lightningInvoice}
                    lightningQrCode={
                        wallet.lightningInvoice === '' ? undefined : (
                            <Box
                                height={512}
                                width={512}
                                padding={8}
                                backgroundColor="surfaceFillRaised"
                            >
                                <QrCode value={wallet.lightningInvoice} />
                            </Box>
                        )
                    }
                    onCopyBitcoinAddress={() => copyToClipboard(wallet.bitcoinDepositAddress)}
                    onCopyLightningInvoice={() => copyToClipboard(wallet.lightningInvoice)}
                    onRefreshLightningInvoice={refreshLightningInvoice}
                />
            )}
        </SparkLayout>
    );
};
