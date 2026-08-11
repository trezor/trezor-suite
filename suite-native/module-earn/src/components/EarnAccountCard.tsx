import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { isApyAvailable, isSupportedStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation, selectSupportedLanguageLocale } from '@suite-native/intl';
import {
    selectApy,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
    selectIsCardanoStakedOutsideEverstake,
    selectTronAvailableVotingPowerByAccountKey,
    selectTronVotesByAccountKey,
    useSelector as useStakingSelector,
} from '@suite-native/staking';

import { EarnAccountCardLayout } from './EarnAccountCardLayout';
import { EarnClaimAlert } from './EarnClaimAlert';
import { EarnTronVotingAlert } from './EarnTronVotingAlert';
import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';
import { type EarnDepositsCardActiveItem } from '../types';
import { formatEarnActiveItemBalance } from '../utils/earnAmountUtils';

type EarnAccountCardProps = {
    item: EarnDepositsCardActiveItem;
    onPress: () => void;
    onClaimPress?: () => void;
};

export const EarnAccountCard = ({ item, onPress, onClaimPress }: EarnAccountCardProps) => {
    const isStakingItem = item.type === 'staking';
    const isDefiYieldItem = item.type === 'stablecoin-yield';
    const isSupportedStaking = isStakingItem && isSupportedStakingNetworkSymbol(item.symbol);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const locale = useSelector(selectSupportedLanguageLocale);

    const symbol = isStakingItem ? item.symbol : item.networkSymbol;

    const apy = useStakingSelector(state =>
        isStakingItem
            ? selectApy(state, { accountKey: item.accountKey, networkSymbol: item.symbol })
            : null,
    );

    const { stats: tronStats, formattedMaxApr: tronMaxApr } = useTronStakingStats({
        enabled: isStakingItem && item.symbol === 'trx',
    });

    const tronVotes = useStakingSelector(state =>
        selectTronVotesByAccountKey(state, item.accountKey),
    );

    const votedTronApr = getTronVotedApr(
        tronStats.data,
        tronVotes.map(({ address }) => address),
    );

    const tronApr = formatTronApr(votedTronApr ?? tronMaxApr);

    const resolvedApy = symbol === 'trx' ? tronApr : apy;
    const apyValue = isStakingItem ? resolvedApy : item.apy;

    const availableTronVotingPower = useStakingSelector(state =>
        selectTronAvailableVotingPowerByAccountKey(state, item.accountKey),
    );

    const isAdaStakedOutsideEverstake = useStakingSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, item.accountKey),
    );

    const canClaim = useStakingSelector(state =>
        isSupportedStaking ? selectCanClaimByAccountKey(state, item.accountKey) : false,
    );

    const claimableAmount =
        useStakingSelector(state =>
            isSupportedStaking ? selectClaimableAmountByAccountKey(state, item.accountKey) : '0',
        ) ?? '0';

    const { isClaimingDisabled } = useMessageSystemStaking(isStakingItem ? item.symbol : null);

    const showClaimAlert = canClaim && !isClaimingDisabled && !isPortfolioTrackerDevice;

    const showTronVotingAlert =
        isStakingItem && item.symbol === 'trx' && availableTronVotingPower !== '0';

    const contractAddress = isDefiYieldItem ? item.tokenContractAddress : undefined;
    const secondaryDescription = isDefiYieldItem
        ? item.accountLabel || getNetworkDisplaySymbolName(item.networkSymbol)
        : null;

    return (
        <EarnAccountCardLayout
            accountKey={item.accountKey}
            icon={
                <TokenIcon
                    symbol={symbol}
                    contractAddress={contractAddress}
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
            value={<Text variant="body-md">{formatEarnActiveItemBalance({ item, locale })}</Text>}
            valueDescription={
                (isAdaStakedOutsideEverstake || apyValue != null) && (
                    <Text variant="body-sm" color="contentSecondary">
                        {isAdaStakedOutsideEverstake || !isApyAvailable(apyValue) ? (
                            <Translation id="earn.notAvailableShort" />
                        ) : (
                            <>
                                {item.type === 'staking' ? (
                                    <Translation
                                        id={
                                            symbol === 'trx'
                                                ? 'earn.aprPercentage'
                                                : 'earn.apyPercentage'
                                        }
                                        values={{ apy: apyValue }}
                                    />
                                ) : (
                                    <Translation
                                        id="earn.ratePercentage"
                                        values={{ apy: apyValue }}
                                    />
                                )}
                            </>
                        )}
                    </Text>
                )
            }
            alerts={
                <>
                    {showClaimAlert && onClaimPress && (
                        <EarnClaimAlert
                            claimableAmount={claimableAmount}
                            symbol={symbol}
                            onClaimPress={onClaimPress}
                        />
                    )}

                    {showTronVotingAlert && (
                        <EarnTronVotingAlert votesRemaining={availableTronVotingPower} />
                    )}
                </>
            }
            onPress={onPress}
        />
    );
};
