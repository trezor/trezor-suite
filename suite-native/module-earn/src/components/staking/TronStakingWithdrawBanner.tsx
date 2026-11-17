import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    getTronWithdrawableBalance,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

interface TronStakingWithdrawBannerProps {
    accountKey: AccountKey;
    nowSeconds: number;
}

export const TronStakingWithdrawBanner = ({
    accountKey,
    nowSeconds,
}: TronStakingWithdrawBannerProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (account?.networkType !== 'tron') return null;

    const withdrawableBalance = getTronWithdrawableBalance(account, nowSeconds);

    if (withdrawableBalance === '0') return null;

    return (
        <BannerInline
            intent="info"
            title={
                <Translation
                    id="earn.tron.readyToWithdrawAlert"
                    values={{
                        amount: withdrawableBalance,
                        displaySymbol: (
                            <AssetSymbol
                                networkSymbol={account.symbol}
                                variant="body-sm"
                                color="contentInfo"
                            />
                        ),
                    }}
                />
            }
        />
    );
};
