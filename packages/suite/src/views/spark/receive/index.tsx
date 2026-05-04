import { useEffect } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import {
    SparkReceiveView,
    selectSelectedSparkAccount,
    selectSparkWalletByAccountNumber,
} from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Box } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { QrCode } from 'src/components/suite/QrCode';
import { useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { SparkLayout } from '../SparkLayout';

export const SparkReceive = () => {
    const { spark } = useSuiteServices();
    const device = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );
    const wallet = useSelector(state =>
        walletDescriptor && selectedAccount
            ? selectSparkWalletByAccountNumber(state, {
                  accountNumber: selectedAccount.accountNumber,
                  walletDescriptor,
              })
            : undefined,
    );

    const refreshLightningInvoice = () => {
        if (!walletDescriptor || !selectedAccount || !deviceStaticSessionId) {
            return;
        }

        void spark.loadSparkReceiveDetails({
            accountNumber: selectedAccount.accountNumber,
            deviceStaticSessionId,
            walletDescriptor,
        });
    };

    useEffect(() => {
        if (!wallet || !walletDescriptor || !selectedAccount || !deviceStaticSessionId) {
            return;
        }

        if (wallet.bitcoinDepositAddress !== '' && wallet.lightningInvoice !== '') {
            return;
        }

        void spark.loadSparkReceiveDetails({
            accountNumber: selectedAccount.accountNumber,
            deviceStaticSessionId,
            walletDescriptor,
        });
    }, [deviceStaticSessionId, selectedAccount, spark, wallet, walletDescriptor]);

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
