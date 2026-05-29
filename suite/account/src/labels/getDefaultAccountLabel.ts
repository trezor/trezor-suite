import { type TranslationFunction } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getTitleForCoinjoinAccount } from '@suite-common/wallet-utils';

type GetDefaultAccountLabelParams = Pick<Account, 'accountType' | 'symbol' | 'index'>;

export const getDefaultAccountLabel = (
    translationString: TranslationFunction,
    { accountType, symbol, index = 0 }: GetDefaultAccountLabelParams,
) => {
    if (accountType === 'coinjoin') {
        return translationString(getTitleForCoinjoinAccount(symbol));
    }

    return translationString('LABELING_ACCOUNT', {
        networkName: getNetwork(symbol).name,
        index: index + 1,
    });
};
