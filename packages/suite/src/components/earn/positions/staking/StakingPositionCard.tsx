import { useSelector } from 'react-redux';

import { gotoThunk } from '@suite/router';
import { formatStakingAmount, useNetworkStakingRate } from '@suite-common/earn-staking';
import {
    type StakingPosition,
    type StakingProductDescriptor,
    getStakingPositionAmount,
} from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';

import { EarnPositionCard } from '../EarnPositionCard';
import { StakingPositionBadges } from './StakingPositionBadges';

type StakingPositionCardProps = {
    position: StakingPosition;
    descriptor: StakingProductDescriptor;
    accountKey: AccountKey;
};

export const StakingPositionCard = ({
    position,
    descriptor,
    accountKey,
}: StakingPositionCardProps) => {
    const { name: productName, networkSymbol, rateKind } = descriptor;

    const { dispatch } = useServices(injectDispatch);
    const { CryptoAmountFormatter } = useFormatters();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const stakingBalance = formatStakingAmount({
        amount: getStakingPositionAmount(position),
        networkSymbol,
    });

    const { rate, isPending: isRatePending } = useNetworkStakingRate({
        networkSymbol,
        accountKey,
    });

    const onPositionCardClick = () => {
        if (!account) return;

        dispatch(
            gotoThunk({
                routeName: 'wallet-staking',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    if (!account) return null;

    const icon = <TokenIcon networkSymbol={networkSymbol} size={40} />;

    const fiatAmount = <BaseCurrencyValue amount={stakingBalance} symbol={account.symbol} />;

    const cryptoAmount = (
        <CryptoAmountFormatter
            value={stakingBalance}
            symbol={account.symbol}
            isBalance
            withSymbol
            formatStyle="compact-balance"
        />
    );

    const badges = (
        <StakingPositionBadges
            accountKey={accountKey}
            balances={position.balances}
            rate={isRatePending ? undefined : rate}
            rateKind={rateKind}
        />
    );

    return (
        <EarnPositionCard
            icon={icon}
            label={productName}
            account={account}
            fiatAmount={fiatAmount}
            cryptoAmount={cryptoAmount}
            badges={badges}
            onClick={onPositionCardClick}
        />
    );
};
