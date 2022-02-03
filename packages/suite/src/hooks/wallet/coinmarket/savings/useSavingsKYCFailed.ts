import { useEffect } from 'react';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import { useActions, useSelector } from '@suite-hooks';
import type { SavingsKYCFailedContextValues } from '@wallet-types/coinmarket/savings/KYCFailed';

export const useSavingsKYCFailed = (): SavingsKYCFailedContextValues => {
    const { savingsInfo } = useSelector(state => ({
        invityAuthentication: state.wallet.coinmarket.invityAuthentication,
        savingsInfo: state.wallet.coinmarket.savings.savingsInfo,
    }));

    const { loadInvityData } = useActions({
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const provider = savingsInfo?.savingsList?.providers[0];

    return {
        supportUrl: provider?.supportUrl,
    };
};
