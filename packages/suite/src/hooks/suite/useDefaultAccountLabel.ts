import { getTitleForNetwork, getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';
import { useCallback } from 'react';
import { useTranslation } from './useTranslation';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';

export interface GetDefaultAccountLabel {
    accountType: AccountType;
    symbol: NetworkSymbol;
    index?: number;
}

export const useDefaultAccountLabel = () => {
    const { translationString } = useTranslation();

    const getDefaultAccountLabel = useCallback(
        ({ accountType, symbol, index = 0 }: GetDefaultAccountLabel): string => {
            if (accountType === 'coinjoin') {
                return translationString(getTitleForCoinjoinAccount(symbol));
            }

            return translationString('LABELING_ACCOUNT', {
                networkName: translationString(getTitleForNetwork(symbol)), // Bitcoin, Ethereum, ...
                index: index + 1, // This is the number which shows after hash, e.g. Ethereum #3
            });
        },
        [translationString],
    );

    return {
        getDefaultAccountLabel,
    };
};
