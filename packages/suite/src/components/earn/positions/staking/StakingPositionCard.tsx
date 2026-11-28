import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { formatStakingAmount, useStakingRate } from '@suite-common/earn-staking';
import {
    type StakingPosition,
    type StakingProductDescriptor,
    getStakingPositionAmount,
    hasUnvaluedLiquidStakingBalance,
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
    const { id: productId, name: productName, networkSymbol, rateKind } = descriptor;
    const isLidoPosition = descriptor.providerId === 'lido' && descriptor.type === 'liquid';

    const { dispatch } = useServices(injectDispatch);
    const { CryptoAmountFormatter } = useFormatters();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const stakingBalance = formatStakingAmount({
        amount: getStakingPositionAmount(position),
        networkSymbol,
    });

    const { rate, isPending: isRatePending } = useStakingRate({
        productId,
        accountKey,
    });

    const onPositionCardClick = () => {
        if (!account) return;

        dispatch(
            gotoThunk({
                routeName: isLidoPosition ? 'earn-lido' : 'wallet-staking',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };

    if (!account) return null;

    const liquidToken = position.details?.kind === 'liquid-token' ? position.details : null;
    const icon = (
        <TokenIcon
            networkSymbol={networkSymbol}
            contractAddress={liquidToken?.contract}
            size={40}
        />
    );

    const isValueUnavailable = hasUnvaluedLiquidStakingBalance(position);
    const fiatAmount = isValueUnavailable ? (
        <Translation id="TR_EARN_N_A" />
    ) : (
        <BaseCurrencyValue amount={stakingBalance} symbol={account.symbol} />
    );

    const cryptoAmount = !isValueUnavailable && (
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
            accountKey={descriptor.isCountedInAccountTotals ? accountKey : undefined}
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
