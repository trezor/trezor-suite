import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    WALLET_SDK_SOURCE_MOBILE,
    getEthereumStakingAdapter,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type EarnFormValues, earnFormValidationSchema } from '../../utils/earn/earnFormSchema';
import { buildEarnComposeFormState } from '../../utils/earn/utils';
import { useComposeEarnFees } from '../earn/useComposeEarnFees';

export const useStakingForm = (accountKey: AccountKey) => {
    const { translate } = useTranslate();
    const { CryptoAmountFormatter } = useFormatters();
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
            formatCryptoAmount: account
                ? (amount: string) =>
                      CryptoAmountFormatter.format(amount, {
                          symbol: account.symbol,
                          isBalance: true,
                          withSymbol: false,
                      })
                : undefined,
        },
        defaultValues: { amount: '', fiat: '' },
    });

    const amountValue = useWatch({ control: form.control, name: 'amount' });
    const {
        formState: { isValid },
    } = form;

    const stakeFormState = useMemo(() => {
        if (!account || !isValid || !amountValue) return undefined;

        if (account.networkType === 'solana') {
            return buildEarnComposeFormState(account.descriptor, amountValue, '');
        }

        const step = getEthereumStakingAdapter(DEFAULT_ETHEREUM_STAKING_PROVIDER_ID).buildStep(
            { type: 'stake', amount: amountValue },
            { symbol: account.symbol, source: WALLET_SDK_SOURCE_MOBILE },
        );
        if (!step) return undefined;

        return buildEarnComposeFormState(step.to, amountValue, step.data);
    }, [account, isValid, amountValue]);

    const { formDraft, formDraftKey, isFeeUnavailable, isPrecomposeError, updateFeeLevelThunk } =
        useComposeEarnFees({
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
        isPrecomposeError,
        updateFeeLevelThunk,
    };
};
