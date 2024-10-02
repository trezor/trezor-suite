import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { useCallback } from 'react';
import { useTranslation } from './useTranslation';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';

export interface GetDefaultAccountLabelParams {
    accountType: AccountType;
    symbol: NetworkSymbol;
    index?: number;
}

export const useDefaultAccountLabel = () => {
    const { translationString } = useTranslation();

    const getDefaultAccountLabel = useCallback(
        ({ accountType, symbol, index = 0 }: GetDefaultAccountLabelParams): string => {
            if (accountType === 'coinjoin') {
                return translationString(getTitleForCoinjoinAccount(symbol));
            }

            const displayedAccountNumber = index + 1;

            return translationString('LABELING_ACCOUNT', {
                networkName: translationString(getTitleForNetwork(symbol)), // Bitcoin, Ethereum, ...
                index: displayedAccountNumber,
            });
        },
        [translationString],
    );

    return {
        getDefaultAccountLabel,
    };
};
