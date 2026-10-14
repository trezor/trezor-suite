import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    selectAccountByKey,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    selectTronAvailableVotingPowerByAccountKey,
} from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { ZeroApyBadge } from '@suite-native/accounts';
import { Text } from '@suite-native/atoms';
import { CompactCryptoAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useStakingDetailNavigation } from '../../hooks/staking/useStakingDetailNavigation';
import { useStakingNavigateAnalytics } from '../../hooks/staking/useStakingNavigateAnalytics';
import { useStakingRate } from '../../hooks/staking/useStakingRate';
import { type StakingListItem } from '../../types';
import { ApyValue } from '../earn/ApyValue';
import { EarnAccountCardLayout } from '../earn/EarnAccountCardLayout';
import { EarnTronVotingAlert } from '../earn/EarnTronVotingAlert';

type StakingPositionCardProps = {
    item: StakingListItem;
    onClose: () => void;
};

export const StakingPositionCard = ({ item, onClose }: StakingPositionCardProps) => {
    const { symbol, accountKey, balance } = item;

    const reportStakingNavigate = useStakingNavigateAnalytics();
    const { navigateToStakingDetail } = useStakingDetailNavigation();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { rate: apy } = useStakingRate({ symbol, accountKey });

    const availableTronVotingPower = useSelector((state: AccountsRootState) =>
        selectTronAvailableVotingPowerByAccountKey(state, item.accountKey),
    );

    const isAdaStakedOutsideEverstake = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, item.accountKey),
    );

    const isStakedWithFiveBinaries = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, item.accountKey),
    );

    const showTronVotingAlert = symbol === 'trx' && availableTronVotingPower !== '0';

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
                    size="extraSmall"
                    showNetworkIcon
                    wrappedTokenIcon="token"
                />
            }
            title={getNetworkDisplaySymbolName(symbol)}
            description={
                account?.accountLabel ? (
                    <Text variant="body-sm" color="contentSecondary">
                        {account.accountLabel}
                    </Text>
                ) : null
            }
            value={
                <CompactCryptoAmountFormatter
                    value={balance}
                    symbol={symbol}
                    isBalance={true}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    variant="body-md"
                    color="contentPrimary"
                />
            }
            valueDescription={
                (isAdaStakedOutsideEverstake || apy != null) &&
                (isStakedWithFiveBinaries ? (
                    <ZeroApyBadge />
                ) : (
                    <Text variant="body-sm" color="contentSecondary">
                        {isAdaStakedOutsideEverstake || !isApyAvailable(apy) ? (
                            <ApyValue apy={null} withLabel />
                        ) : (
                            <Translation
                                id={symbol === 'trx' ? 'earn.aprPercentage' : 'earn.apyPercentage'}
                                values={{ apy }}
                            />
                        )}
                    </Text>
                ))
            }
            alerts={
                showTronVotingAlert && (
                    <EarnTronVotingAlert votesRemaining={availableTronVotingPower} />
                )
            }
            onPress={onPress}
        />
    );
};
