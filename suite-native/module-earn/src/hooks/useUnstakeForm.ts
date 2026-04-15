import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getEthereumStakingAddressByType } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import {
    type NativeStakingRootState,
    buildUnstakeCalldata,
    ethToWei,
    selectStakedBalanceByAccountKey,
} from '@suite-native/staking';
import { BigNumber } from '@trezor/utils';

import { NETWORK_FEE_WARNING_MULTIPLIER } from '../constants';
import { type EarnFormValues } from '../earnFormSchema';
import { unstakeFormValidationSchema } from '../unstakeFormSchema';
import { buildEarnComposeFormState } from '../utils';
import { useComposeEarnFees } from './useComposeEarnFees';

export const useUnstakeForm = (accountKey: AccountKey) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const stakedBalance = useSelector((state: NativeStakingRootState) =>
        selectStakedBalanceByAccountKey(state, accountKey),
    );

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<EarnFormValues>({
        validation: unstakeFormValidationSchema,
        mode: 'onTouched',
        context: {
            symbol: account?.symbol,
            stakedBalance,
            decimals: network?.decimals,
            translate,
        },
        defaultValues: { amount: '', fiat: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });
    const {
        formState: { isValid },
    } = form;

    const unstakeFormState = useMemo(() => {
        if (!account || !isValid || !amountValue) return undefined;

        return buildEarnComposeFormState(
            getEthereumStakingAddressByType(account.symbol, 'unstake'),
            '0',
            buildUnstakeCalldata(ethToWei(amountValue)),
        );
    }, [account, isValid, amountValue]);

    const { formDraft, formDraftKey, updateFeeLevelThunk } = useComposeEarnFees({
        accountKey,
        formState: unstakeFormState,
        formDraftPrefix: 'unstake',
    });

    if (!account) return null;

    const limits = getStakingLimitsByNetworkSymbol(account.symbol);
    const networkFeeWarningThreshold = limits?.MIN_BALANCE_FOR_FEE_BUFFER.times(
        NETWORK_FEE_WARNING_MULTIPLIER,
    );
    const showNetworkFeeWarning =
        !!networkFeeWarningThreshold &&
        !!amountValue &&
        new BigNumber(amountValue).gt(0) &&
        new BigNumber(amountValue).lt(networkFeeWarningThreshold);

    return {
        form,
        amountValue,
        showNetworkFeeWarning,
        formDraft,
        formDraftKey,
        updateFeeLevelThunk,
    };
};
