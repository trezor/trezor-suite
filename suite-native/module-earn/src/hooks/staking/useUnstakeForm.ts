import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    UNSTAKE_INTERCHANGES,
    WALLET_SDK_SOURCE_MOBILE,
    buildUnstakeData,
    getEthereumStakingAddressByType,
    getStakingLimitsByNetworkSymbol,
    selectAccountByKey,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
    selectStakedBalanceByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { fromEther, isPositiveBalance } from '@suite-common/wallet-utils';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { useApproximateInstantUnstakeAmount } from './useApproximateInstantUnstakeAmount';
import { NETWORK_FEE_WARNING_MULTIPLIER } from '../../constants';
import { type EarnFormValues } from '../../utils/earn/earnFormSchema';
import { buildEarnComposeFormState } from '../../utils/earn/utils';
import { unstakeFormValidationSchema } from '../../utils/staking/unstakeFormSchema';
import { useComposeEarnFees } from '../earn/useComposeEarnFees';

export const useUnstakeForm = (accountKey: AccountKey) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const stakedBalance = useSelector((state: StakeRootState) =>
        selectStakedBalanceByAccountKey(state, accountKey),
    );
    const canClaim = useSelector((state: StakeRootState) =>
        selectCanClaimByAccountKey(state, accountKey),
    );
    const claimableAmount =
        useSelector((state: StakeRootState) =>
            selectClaimableAmountByAccountKey(state, accountKey),
        ) ?? '0';

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<EarnFormValues>({
        validation: unstakeFormValidationSchema,
        mode: 'onTouched',
        context: {
            account,
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

        if (account.networkType === 'solana') {
            // Solana compose uses output amount (not calldata); pass the real amount, not '0'.
            return buildEarnComposeFormState(account.descriptor, amountValue, '');
        }

        const amountWei = fromEther(amountValue).toWei();
        if (!isPositiveBalance(amountWei)) return undefined;

        return buildEarnComposeFormState(
            getEthereumStakingAddressByType(account.symbol, 'unstake'),
            '0',
            buildUnstakeData(amountWei, UNSTAKE_INTERCHANGES, WALLET_SDK_SOURCE_MOBILE),
        );
    }, [account, isValid, amountValue]);

    const { formDraft, formDraftKey, isFeeUnavailable, isPrecomposeError, updateFeeLevelThunk } =
        useComposeEarnFees({
            accountKey,
            formState: unstakeFormState,
            formDraftPrefix: 'unstake',
        });

    const approximatedInstantEthAmount = useApproximateInstantUnstakeAmount(
        accountKey,
        amountValue,
    );

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
        account,
        amountValue,
        stakedBalance,
        canClaim,
        claimableAmount,
        showNetworkFeeWarning,
        formDraft,
        formDraftKey,
        isFeeUnavailable,
        isPrecomposeError,
        updateFeeLevelThunk,
        approximatedInstantEthAmount,
    };
};
