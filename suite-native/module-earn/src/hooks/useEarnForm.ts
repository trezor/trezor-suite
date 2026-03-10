import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';

import { EarnFormValues, earnFormValidationSchema } from '../earnFormSchema';

export const useEarnForm = (accountKey: AccountKey) => {
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
        },
        defaultValues: { amount: '', fiat: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });

    if (!account) return null;

    return { form, amountValue };
};
