import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { buildStakeData, getEthereumStakingAddressByType } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type EarnFormValues, earnFormValidationSchema } from '../earnFormSchema';
import { buildEarnComposeFormState } from '../utils';
import { useComposeEarnFees } from './useComposeEarnFees';

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
    const {
        formState: { isValid },
    } = form;

    const stakeFormState = useMemo(() => {
        if (!account || !isValid || !amountValue) return undefined;

        return buildEarnComposeFormState(
            getEthereumStakingAddressByType(account.symbol, 'stake'),
            amountValue,
            buildStakeData(),
        );
    }, [account, isValid, amountValue]);

    const { formDraft, formDraftKey, isFeeUnavailable, updateFeeLevelThunk } = useComposeEarnFees({
        accountKey,
        formState: stakeFormState,
        formDraftPrefix: 'stake',
    });

    if (!account) return null;

    return {
        form,
        amountValue,
        account,
        formDraft,
        formDraftKey,
        isFeeUnavailable,
        updateFeeLevelThunk,
    };
};
