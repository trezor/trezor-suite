import type { SavingsTrade } from '@suite-services/invityAPI';
import { useMemo } from 'react';

const useSavingsSetupDefaultValues = (
    savingsTrade: SavingsTrade | undefined,
    unusedAddress: string | undefined,
) => {
    // TODO: defaultValues hardcoded?
    const defaultPaymentFrequency = 'Weekly';
    const defaultFiatAmount = '50';

    // TODO: define 'fiat amount options' and set fiatAmount = 'Custom' if not from 'fiat amount options'

    const defaultValues = useMemo(
        () =>
            savingsTrade
                ? {
                      fiatAmount: savingsTrade.fiatStringAmount || defaultFiatAmount,
                      paymentFrequency: savingsTrade.paymentFrequency || defaultPaymentFrequency,
                      customFiatAmount: savingsTrade.fiatStringAmount || defaultFiatAmount,
                      address: savingsTrade.receivingCryptoAddresses?.[0] || unusedAddress,
                  }
                : undefined,
        [savingsTrade, unusedAddress],
    );

    return defaultValues;
};

export default useSavingsSetupDefaultValues;
