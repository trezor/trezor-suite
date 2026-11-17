import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingAccountProductRootState,
    type StakingRootState,
    formatStakingAmount,
    isStakingOperationAvailable,
    selectStakingAccountProductDescriptor,
    selectStakingAccountTotals,
    selectStakingPosition,
    useStakingAccess,
} from '@suite-common/earn-staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    UNSTAKE_INTERCHANGES,
    WALLET_SDK_SOURCE_MOBILE,
    buildUnstakeData,
    getEthereumStakingAddressByType,
    getStakingLimitsByNetworkSymbol,
    selectAccountByKey,
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
    const productId = useSelector(
        (state: StakingAccountProductRootState) =>
            selectStakingAccountProductDescriptor(state, accountKey)?.id ?? null,
    );
    const position = useSelector((state: StakingRootState) =>
        productId === null ? null : selectStakingPosition(state, accountKey, productId),
    );
    const totals = useSelector((state: StakingRootState) =>
        selectStakingAccountTotals(state, accountKey),
    );
    const access = useStakingAccess(productId);

    const network = account ? getNetwork(account.symbol) : null;

    // The whole stake can be unstaked; a withdrawal waits for its own flow.
    const unstakableBalance = account
        ? formatStakingAmount({ amount: totals.staked, networkSymbol: account.symbol })
        : '0';
    const canClaim = isStakingOperationAvailable({ position, access, operation: 'withdraw' });
    const claimableAmount = account
        ? formatStakingAmount({ amount: totals.withdrawable, networkSymbol: account.symbol })
        : '0';

    const form = useForm<EarnFormValues>({
        validation: unstakeFormValidationSchema,
        mode: 'onTouched',
        context: {
            account,
            symbol: account?.symbol,
            unstakableBalance,
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

    const fees = useComposeEarnFees({
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
        unstakableBalance,
        canClaim,
        claimableAmount,
        showNetworkFeeWarning,
        ...fees,
        approximatedInstantEthAmount,
    };
};
