import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type {
    SavingsBankAccountContextValues,
    SavingsBankAccountFormState,
} from '@wallet-types/coinmarketSavingsBankAccount';
import { useSelector } from '@suite-hooks/useSelector';
import { useActions } from '@suite-hooks/useActions';
import invityAPI, { SavingsTrade } from '@suite-services/invityAPI';
import * as coinmarketSavingsActions from '@wallet-actions/coinmarketSavingsActions';
import { useCoinmarketNavigation } from '@wallet-hooks/useCoinmarketNavigation';
import { UseSavingsBankAccountProps } from '@wallet-types/coinmarketSavingsBankAccount';

export const useCoinmarketSavingsBankAccount = ({
    selectedAccount,
}: UseSavingsBankAccountProps): SavingsBankAccountContextValues => {
    const { account } = selectedAccount;
    const { isWatchingKYCStatus, isSavingsTradeLoading } = useSelector(state => ({
        isWatchingKYCStatus: state.wallet.coinmarket.savings.isWatchingKYCStatus,
        isSavingsTradeLoading: state.wallet.coinmarket.savings.isSavingsTradeLoading,
    }));
    const methods = useForm<SavingsBankAccountFormState>({
        mode: 'onChange',
    });

    const { navigateToSavingsOverview } = useCoinmarketNavigation(account);

    const { savingsTrade } = useSelector(state => ({
        savingsTrade: state.wallet.coinmarket.savings.savingsTrade,
    }));

    const { saveSavingsTradeResponse } = useActions({
        saveSavingsTradeResponse: coinmarketSavingsActions.saveSavingsTradeResponse,
    });

    const { register } = methods;

    const onSubmit = useCallback(
        async ({
            typeOption,
            name,
            accountNumber,
            routingNumber,
            bankAccountOwner,
        }: SavingsBankAccountFormState) => {
            if (savingsTrade) {
                const trade: SavingsTrade = {
                    ...savingsTrade,
                    bankAccount: {
                        name,
                        type: typeOption.value,
                        accountNumber,
                        routingNumber,
                        holder: bankAccountOwner,
                    },
                };
                const response = await invityAPI.doSavingsTrade({
                    trade,
                });
                if (response) {
                    saveSavingsTradeResponse(response);
                    if (response.trade?.status === 'Active') {
                        navigateToSavingsOverview();
                    }
                }
            }
        },
        [navigateToSavingsOverview, saveSavingsTradeResponse, savingsTrade],
    );

    // TODO: extract
    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...methods,
        register: typedRegister,
        onSubmit,
        isWatchingKYCStatus,
        isSavingsTradeLoading,
    };
};
