import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getStakingLimitsByNetworkSymbol,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { BannerInline } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

type EarnWithdrawalFeesBannerProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    isMaxSelected: boolean;
};

export const EarnWithdrawalFeesBanner = ({
    accountKey,
    symbol,
    isMaxSelected,
}: EarnWithdrawalFeesBannerProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { value: amountValue, hasError } = useField({ name: 'amount' });

    const limits = getStakingLimitsByNetworkSymbol(symbol);

    if (!limits || !account || hasError || !amountValue) return null;

    const { displaySymbol } = getNetwork(symbol);
    const formattedBalance = formatNetworkAmount(account.availableBalance, symbol);

    const isBelowWithdrawalReserve = new BigNumber(formattedBalance)
        .minus(amountValue)
        .lt(limits.MIN_FOR_WITHDRAWALS);

    if (!isBelowWithdrawalReserve && !isMaxSelected) return null;

    return (
        <BannerInline
            intent={isBelowWithdrawalReserve ? 'warning' : 'info'}
            title={
                <Translation
                    id={
                        isBelowWithdrawalReserve
                            ? 'earn.earnFormScreen.withdrawalFeesRecommendation'
                            : 'earn.earnFormScreen.withdrawalFeesBanner'
                    }
                    values={{
                        amount: limits.MIN_FOR_WITHDRAWALS.toString(),
                        displaySymbol,
                    }}
                />
            }
        />
    );
};
