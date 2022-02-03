import { useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions, useSelector } from '@suite-hooks';
import type { SavingsKYCFailedContextValues } from '@wallet-types/coinmarket/savings/KYCFailed';

export const useSavingsKYCFailed = (): SavingsKYCFailedContextValues => {
    const { selectedProvider } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        selectedProvider: state.wallet.coinmarket.savings.selectedProvider,
    }));

    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    return {
        supportUrl: selectedProvider?.supportUrl,
    };
};
