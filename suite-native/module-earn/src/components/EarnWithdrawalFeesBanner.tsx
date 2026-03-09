import { useSelector } from 'react-redux';

import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount, getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';
import { InlineAlertBox } from '@suite-native/atoms';
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
    const { value: amountValue } = useField({ name: 'amount' });

    const limits = getStakingLimitsByNetworkSymbol(symbol);

    if (!limits || !account) return null;

    const { displaySymbol } = getNetwork(symbol);
    const formattedBalance = formatNetworkAmount(account.availableBalance, symbol);
    const maxStakeAmount = new BigNumber(formattedBalance).minus(limits.MIN_BALANCE_FOR_FEE_BUFFER);

    const isVisible =
        !!amountValue && new BigNumber(amountValue).gte(maxStakeAmount) && maxStakeAmount.gt(0);

    if (!isVisible) return null;

    return (
        <InlineAlertBox
            variant="info"
            title={
                <Translation
                    id="earn.earnFormScreen.withdrawalFeesBanner"
                    values={{
                        amount: limits.MIN_BALANCE_FOR_FEE_BUFFER.toString(),
                        displaySymbol,
                    }}
                />
            }
        />
    );
};
