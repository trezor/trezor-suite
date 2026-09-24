import { useSelector } from 'react-redux';

import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    isSupportedTronStakingNetworkSymbol,
    selectApy,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    selectTronAvailableVotingPowerByAccountKey,
    selectTronVotesByAccountKey,
} from '@suite-common/wallet-core';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { ZeroApyBadge } from '@suite-native/accounts';
import { Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { ApyValue } from './ApyValue';
import { EarnAccountCardLayout } from './EarnAccountCardLayout';
import { EarnAccountCardValue } from './EarnAccountCardValue';
import { EarnTronVotingAlert } from './EarnTronVotingAlert';
import { type EarnDepositsCardActiveItem } from '../../types';

type EarnAccountCardProps = {
    item: EarnDepositsCardActiveItem;
    onPress: () => void;
};

export const EarnAccountCard = ({ item, onPress }: EarnAccountCardProps) => {
    const isStakingItem = item.type === 'staking';
    const isDefiYieldItem = item.type === 'stablecoin-yield';

    const symbol = isStakingItem ? item.symbol : item.networkSymbol;

    const apy = useSelector((state: StakeRootState) =>
        isStakingItem
            ? selectApy(state, { accountKey: item.accountKey, networkSymbol: item.symbol })
            : null,
    );

    const { stats: tronStats, formattedMaxApr: tronMaxApr } = useTronStakingStats({
        enabled: isStakingItem && isSupportedTronStakingNetworkSymbol(item.symbol),
    });

    const tronVotes = useSelector((state: AccountsRootState) =>
        selectTronVotesByAccountKey(state, item.accountKey),
    );

    const votedTronApr = getTronVotedApr(
        tronStats.data,
        tronVotes.map(({ address }) => address),
    );

    const tronApr = formatTronApr(votedTronApr ?? tronMaxApr);

    const isTronStaking = isSupportedTronStakingNetworkSymbol(symbol);
    const resolvedApy = isTronStaking ? tronApr : apy;
    const apyValue = isStakingItem ? resolvedApy : item.apy;

    const availableTronVotingPower = useSelector((state: AccountsRootState) =>
        selectTronAvailableVotingPowerByAccountKey(state, item.accountKey),
    );

    const isAdaStakedOutsideEverstake = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, item.accountKey),
    );

    const isStakedWithFiveBinaries = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, item.accountKey),
    );

    const showTronVotingAlert = isStakingItem && isTronStaking && availableTronVotingPower !== '0';

    const contractAddress = isDefiYieldItem ? item.tokenContractAddress : undefined;

    const secondaryDescription = isDefiYieldItem
        ? item.accountLabel || getNetworkDisplaySymbolName(item.networkSymbol)
        : item.accountLabel || null;

    return (
        <EarnAccountCardLayout
            accountKey={item.accountKey}
            icon={
                <TokenIcon
                    networkSymbol={symbol}
                    contractAddress={contractAddress}
                    tokenSymbol={item.type === 'stablecoin-yield' ? item.tokenSymbol : item.symbol}
                    size="extraSmall"
                    showNetworkIcon
                    wrappedTokenIcon={isDefiYieldItem ? 'network' : 'token'}
                />
            }
            title={item.title}
            description={
                secondaryDescription && (
                    <Text variant="body-sm" color="contentSecondary">
                        {secondaryDescription}
                    </Text>
                )
            }
            value={<EarnAccountCardValue item={item} />}
            valueDescription={
                (isAdaStakedOutsideEverstake || apyValue != null) &&
                (isStakedWithFiveBinaries ? (
                    <ZeroApyBadge />
                ) : (
                    <Text variant="body-sm" color="contentSecondary">
                        {isAdaStakedOutsideEverstake || !isApyAvailable(apyValue) ? (
                            <ApyValue apy={null} withLabel />
                        ) : (
                            <Translation
                                id={isTronStaking ? 'earn.aprPercentage' : 'earn.apyPercentage'}
                                values={{ apy: apyValue }}
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
