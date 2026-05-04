import { useState } from 'react';

import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { SparkSendView, selectSelectedSparkAccount } from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { SparkLayout } from '../SparkLayout';

const isPositiveNumericString = (value: string) => /^\d+$/.test(value) && BigInt(value) > 0n;

export const SparkSend = () => {
    const dispatch = useDispatch();
    const { spark } = useSuiteServices();
    const device = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );
    const [invoice, setInvoice] = useState('');
    const [amountSats, setAmountSats] = useState('');

    const isSubmitDisabled =
        !invoice.trim() || (amountSats !== '' && !isPositiveNumericString(amountSats));

    const submitLightningSend = (params: { amountSats?: string; invoice: string }) => {
        if (!deviceStaticSessionId || !walletDescriptor || !selectedAccount) {
            return Promise.resolve(false);
        }

        return spark.submitSparkLightningSend({
            accountNumber: selectedAccount.accountNumber,
            amountSats: params.amountSats,
            deviceStaticSessionId,
            invoice: params.invoice,
            walletDescriptor,
        });
    };

    return (
        <SparkLayout>
            <SparkSendView
                amountSats={amountSats}
                invoice={invoice}
                isSubmitDisabled={isSubmitDisabled}
                onAmountChange={setAmountSats}
                onInvoiceChange={setInvoice}
                onSubmit={async () => {
                    if (isSubmitDisabled) {
                        return;
                    }

                    const hasSent = await submitLightningSend({
                        amountSats: amountSats.trim() || undefined,
                        invoice: invoice.trim(),
                    });

                    if (!hasSent) {
                        return;
                    }

                    setAmountSats('');
                    setInvoice('');
                    dispatch(goto({ routeName: 'spark-index' }));
                }}
            />
        </SparkLayout>
    );
};
