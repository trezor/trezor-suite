import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type AccountKey, type RateTypeWithoutHistoric } from '@suite-common/wallet-types';

import { useFiatRates } from './useFiatRates';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectTickersFromAccount } from '../fiatRatesSelectors';

type UseAccountFiatRatesParams = {
    accountKey: AccountKey | undefined;
    rateType?: RateTypeWithoutHistoric;
    isDisabled?: boolean;
    isPolling?: boolean;
};

/**
 * Subscribes the component to the rates of one account and its tokens. Use it in views that show
 * the balance of one account.
 */
export const useAccountFiatRates = ({
    accountKey,
    rateType = 'current',
    isDisabled,
    isPolling,
}: UseAccountFiatRatesParams) => {
    const tickers = useSelector((state: AccountsRootState & TokenDefinitionsRootState) =>
        selectTickersFromAccount(state, accountKey),
    );

    useFiatRates({ tickers, rateType, isDisabled, isPolling });
};
