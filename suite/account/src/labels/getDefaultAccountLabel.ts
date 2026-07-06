import { type TranslationFunction } from '@suite/intl';
import { getNetwork, isSingleAccountType } from '@suite-common/wallet-config';
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

    const network = getNetwork(symbol);

    // a single-account type has no other accounts to number against
    if (isSingleAccountType(network, accountType)) {
        return network.name;
    }

    return translationString('LABELING_ACCOUNT', {
        networkName: network.name,
        index: index + 1,
    });
};
