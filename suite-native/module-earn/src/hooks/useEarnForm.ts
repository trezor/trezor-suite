import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type EarnFormValues, earnFormValidationSchema } from '../earnFormSchema';

export const useEarnForm = (accountKey: AccountKey) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<EarnFormValues>({
        validation: earnFormValidationSchema,
        mode: 'onTouched',
        context: {
            symbol: account?.symbol,
            availableBalance: account
                ? formatNetworkAmount(account.availableBalance, account.symbol)
                : undefined,
            decimals: network?.decimals,
            translate,
        },
        defaultValues: { amount: '', fiat: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    if (!account) return null;

    return { form, amountValue, account };
};
