import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount, getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { BannerInline } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

type EarnWithdrawalFeesBannerProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
};

export const EarnWithdrawalFeesBanner = ({ accountKey, symbol }: EarnWithdrawalFeesBannerProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { value: amountValue, hasError } = useField({ name: 'amount' });

    const limits = getStakingLimitsByNetworkSymbol(symbol);

    if (!limits || !account) return null;

    const { displaySymbol } = getNetwork(symbol);
    const formattedBalance = formatNetworkAmount(account.availableBalance, symbol);

    const isVisible =
        !hasError &&
        !!amountValue &&
        new BigNumber(formattedBalance).minus(amountValue).lt(limits.MIN_FOR_WITHDRAWALS);

    if (!isVisible) return null;

    return (
        <BannerInline
            intent="warning"
            title={
                <Translation
                    id="earn.earnFormScreen.withdrawalFeesRecommendation"
                    values={{
                        amount: limits.MIN_FOR_WITHDRAWALS.toString(),
                        displaySymbol,
                    }}
                />
            }
        />
    );
};
