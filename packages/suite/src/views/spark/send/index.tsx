import { useState } from 'react';

import { SparkSendView } from '@suite-common/spark';

import { SparkLayout } from '../SparkLayout';
import { useSparkWallet } from '../useSparkWallet';

const isPositiveNumericString = (value: string) => /^\d+$/.test(value) && BigInt(value) > 0n;

export const SparkSend = () => {
    const { goToSparkRoute, submitLightningSend } = useSparkWallet();
    const [invoice, setInvoice] = useState('');
    const [amountSats, setAmountSats] = useState('');

    const isSubmitDisabled = !invoice.trim() || !isPositiveNumericString(amountSats);

    return (
        <SparkLayout>
            <SparkSendView
                amountSats={amountSats}
                invoice={invoice}
                isSubmitDisabled={isSubmitDisabled}
                onAmountChange={setAmountSats}
                onInvoiceChange={setInvoice}
                onSubmit={() => {
                    if (isSubmitDisabled) {
                        return;
                    }

                    submitLightningSend({ amountSats, invoice: invoice.trim() });
                    setAmountSats('');
                    setInvoice('');
                    goToSparkRoute('spark-index');
                }}
            />
        </SparkLayout>
    );
};
