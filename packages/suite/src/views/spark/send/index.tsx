import { useState } from 'react';

import { SparkSendView } from '@suite-common/spark';

import { SparkLayout } from '../SparkLayout';
import { useSparkWallet } from '../useSparkWallet';

const isPositiveNumericString = (value: string) => /^\d+$/.test(value) && BigInt(value) > 0n;

export const SparkSend = () => {
    const { goToSparkRoute, submitLightningSend } = useSparkWallet();
    const [invoice, setInvoice] = useState('');
    const [amountSats, setAmountSats] = useState('');

    const isSubmitDisabled =
        !invoice.trim() || (amountSats !== '' && !isPositiveNumericString(amountSats));

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
                    goToSparkRoute('spark-index');
                }}
            />
        </SparkLayout>
    );
};
