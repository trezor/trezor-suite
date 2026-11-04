import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    type StakingPositionEntry,
    type StakingRootState,
    formatStakingAmount,
    selectIsStakingAccountDelegatedOutside,
    selectIsStakingAccountWithoutPool,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import {
    getStakingPositionAmount,
    hasStakingPositionWarning,
} from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { ZeroApyBadge } from '@suite-native/accounts';
import { Text } from '@suite-native/atoms';
import { useStakingDetailNavigation, useStakingNavigateAnalytics } from '@suite-native/earn';
import { CompactCryptoAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { ApyValue } from '../earn/ApyValue';
import { EarnAccountCardLayout } from '../earn/EarnAccountCardLayout';
import { EarnTronVotingAlert } from '../earn/EarnTronVotingAlert';

type StakingPositionCardProps = {
    entry: StakingPositionEntry;
    onClose: () => void;
};

export const StakingPositionCard = ({ entry, onClose }: StakingPositionCardProps) => {
    const { PercentageFormatter } = useFormatters();
    const { accountKey, position, descriptor } = entry;
    const { networkSymbol: symbol } = descriptor;

    const nativeTokenName = useSelector((state: NetworksRootState) =>
        selectNativeTokenName(state, symbol),
    );

    const reportStakingNavigate = useStakingNavigateAnalytics();
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { rate, rateKind, isPending } = useNetworkStakingRate({
        networkSymbol: symbol,
        accountKey,
    });

    const isDelegatedOutside = useSelector((state: StakingRootState) =>
        selectIsStakingAccountDelegatedOutside(state, accountKey),
    );

    const hasOutdatedProvider = hasStakingPositionWarning(position, 'outdated-provider');
    const hasNoPool = useSelector((state: StakingRootState) =>
        selectIsStakingAccountWithoutPool(state, accountKey),
    );

    const amount = formatStakingAmount({
        amount: getStakingPositionAmount(position),
        networkSymbol: symbol,
    });

    const unallocatedVotingPower =
        position.details?.kind === 'tron-staking' ? position.details.unallocatedVotingPower : null;

    const votesRemaining =
        unallocatedVotingPower !== null && new BigNumber(unallocatedVotingPower).gt(0)
            ? formatStakingAmount({ amount: unallocatedVotingPower, networkSymbol: symbol })
            : null;

    const isRateShown = hasNoPool || isDelegatedOutside || !isPending;
    const isRateAvailable = !isDelegatedOutside && isApyAvailable(rate);

    const rateLabel =
        isRateAvailable && rate !== null ? (
            <Translation
                id={rateKind === 'apr' ? 'earn.aprPercentage' : 'earn.apyPercentage'}
                values={{ apy: PercentageFormatter.format(rate) }}
            />
        ) : (
            <ApyValue apy={null} withLabel rateType={rateKind ?? 'apy'} />
        );

    const onPress = useCallback(() => {
        if (!account) return;

        onClose();

        reportStakingNavigate(account);
        navigateToStakingDetail({ accountKey, symbol });
    }, [account, accountKey, symbol, onClose, reportStakingNavigate, navigateToStakingDetail]);

    return (
        <EarnAccountCardLayout
            accountKey={accountKey}
            icon={
                <TokenIcon
                    networkSymbol={symbol}
                    tokenSymbol={symbol}
                    size="small"
                    showNetworkIcon
                    wrappedTokenIcon="token"
                />
            }
            title={nativeTokenName}
            description={
                account?.accountLabel ? (
                    <Text variant="body-sm" color="contentSecondary">
                        {account.accountLabel}
                    </Text>
                ) : null
            }
            value={
                <CompactCryptoAmountFormatter
                    value={amount}
                    symbol={symbol}
                    isBalance={true}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    variant="body-md"
                    color="contentPrimary"
                />
            }
            valueDescription={
                isRateShown &&
                (hasOutdatedProvider ? (
                    <ZeroApyBadge />
                ) : (
                    <Text variant="body-sm" color="contentSecondary">
                        {hasNoPool ? <Translation id="earn.zeroApyBadge" /> : rateLabel}
                    </Text>
                ))
            }
            alerts={
                votesRemaining !== null && (
                    <EarnTronVotingAlert
                        apr={rateKind === 'apr' ? rate : null}
                        votesRemaining={votesRemaining}
                    />
                )
            }
            onPress={onPress}
        />
    );
};
