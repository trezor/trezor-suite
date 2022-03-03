import { useMemo } from 'react';
import type { SavingsProviderInfo, SavingsTrade } from '@suite-services/invityAPI';
import { CustomPaymentAmountKey } from '@wallet-constants/coinmarket/savings';

const useSavingsSetupDefaultValues = (
    savingsTrade: SavingsTrade | undefined,
    unusedAddress: string | undefined,
    selectedProvider?: SavingsProviderInfo,
) => {
    const defaultValues = useMemo(() => {
        let fiatAmount =
            savingsTrade?.fiatStringAmount || selectedProvider?.defaultPaymentAmount?.toString();
        if (fiatAmount && !selectedProvider?.setupPaymentAmounts.includes(fiatAmount)) {
            fiatAmount = CustomPaymentAmountKey;
        }

        return savingsTrade
            ? {
                  fiatAmount,
                  paymentFrequency:
                      savingsTrade.paymentFrequency || selectedProvider?.defaultPaymentFrequency,
                  customFiatAmount: savingsTrade.fiatStringAmount,
                  address: savingsTrade.receivingCryptoAddresses?.[0] || unusedAddress,
              }
            : undefined;
    }, [
        savingsTrade,
        selectedProvider?.defaultPaymentAmount,
        selectedProvider?.defaultPaymentFrequency,
        selectedProvider?.setupPaymentAmounts,
        unusedAddress,
    ]);

    return defaultValues;
};

export default useSavingsSetupDefaultValues;
