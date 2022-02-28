import { useMemo } from 'react';
import type { SavingsProviderInfo, SavingsTrade } from '@suite-services/invityAPI';
import { CustomPaymentAmountKey } from '@wallet-constants/coinmarket/savings';

const useSavingsSetupDefaultValues = (
    savingsTrade: SavingsTrade | undefined,
    unusedAddress: string | undefined,
    selectedProvider?: SavingsProviderInfo,
) => {
    let fiatAmount = savingsTrade?.fiatStringAmount;
    if (fiatAmount && !selectedProvider?.setupPaymentAmounts.includes(fiatAmount)) {
        fiatAmount = CustomPaymentAmountKey;
    }

    const defaultValues = useMemo(
        () =>
            savingsTrade
                ? {
                      fiatAmount,
                      paymentFrequency: savingsTrade.paymentFrequency,
                      customFiatAmount: savingsTrade.fiatStringAmount,
                      address: savingsTrade.receivingCryptoAddresses?.[0] || unusedAddress,
                  }
                : undefined,
        [fiatAmount, savingsTrade, unusedAddress],
    );

    return defaultValues;
};

export default useSavingsSetupDefaultValues;
