import { useSelector } from 'react-redux';

import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    formatTronApr,
    getTronVotedApr,
    useTronStakingStats,
} from '@suite-common/earn-staking-api';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { isSupportedStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { AccountTypeBadge } from '@suite-native/accounts';
import { Box, Card, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    selectApy,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
    selectIsCardanoStakedOutsideEverstake,
    selectTronAvailableVotingPowerByAccountKey,
    selectTronVotesByAccountKey,
    useSelector as useStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { EarnClaimAlert } from './EarnClaimAlert';
import { EarnTronVotingAlert } from './EarnTronVotingAlert';
import { useMessageSystemStaking } from '../hooks/useMessageSystemStaking';
import { type EarnDepositsCardActiveItem } from '../types';

const itemCardStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.sp16,
}));

const rowStyle = prepareNativeStyle(utils => ({
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const valuesStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

export const formatActiveItemBalance = (item: EarnDepositsCardActiveItem) => {
    const maxDecimals = item.type === 'staking' ? CRYPTO_BALANCE_DECIMALS : 2;
    const balanceValue = Number(item.balance);
    const formattedValue = Number.isNaN(balanceValue)
        ? item.balance
        : balanceValue.toLocaleString(undefined, {
              maximumFractionDigits: maxDecimals,
          });

    return `${formattedValue} ${item.type === 'staking' ? item.symbol.toUpperCase() : item.tokenSymbol}`;
};

type EarnAccountCardProps = {
    item: EarnDepositsCardActiveItem;
    onPress: () => void;
    onClaimPress: () => void;
};

export const EarnAccountCard = ({ item, onPress, onClaimPress }: EarnAccountCardProps) => {
    const { applyStyle } = useNativeStyles();
    const isStakingItem = item.type === 'staking';
    const isStablecoinYieldItem = item.type === 'stablecoin-yield';
    const isSupportedStaking = isStakingItem && isSupportedStakingNetworkSymbol(item.symbol);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

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

    const contractAddress = isStablecoinYieldItem ? item.tokenContractAddress : undefined;
    const secondaryDescription = isStablecoinYieldItem
        ? item.accountLabel || getNetworkDisplaySymbolName(item.networkSymbol)
        : null;

    return (
        <Card borderColor="borderNeutral" noPadding style={applyStyle(itemCardStyle)}>
            <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
                <Box marginRight="sp12">
                    <CryptoIconWithNetwork
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                </Box>

                <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                    <Text>{item.title}</Text>
                    {secondaryDescription && (
                        <Text variant="body-sm" color="contentSecondary">
                            {secondaryDescription}
                        </Text>
                    )}
                    <AccountTypeBadge accountKey={item.accountKey} alignSelf="flex-start" />
                </VStack>

                <VStack spacing="sp2" style={applyStyle(valuesStyle)}>
                    <Text variant="body-md">{formatActiveItemBalance(item)}</Text>
                    {(isAdaStakedOutsideEverstake || apyValue != null) && (
                        <Text variant="body-sm" color="contentSecondary">
                            {isAdaStakedOutsideEverstake ? (
                                <Translation id="earn.notAvailableShort" />
                            ) : (
                                <Translation
                                    id={
                                        symbol === 'trx'
                                            ? 'earn.aprPercentage'
                                            : 'earn.apyPercentage'
                                    }
                                    values={{ apy: apyValue }}
                                />
                            )}
                        </Text>
                    )}
                </VStack>

                <Box marginLeft="sp12">
                    <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
                </Box>
            </PressableOpacity>

            {showClaimAlert && (
                <EarnClaimAlert
                    claimableAmount={claimableAmount}
                    symbol={symbol}
                    onClaimPress={onClaimPress}
                />
            )}

            {showTronVotingAlert && (
                <EarnTronVotingAlert votesRemaining={availableTronVotingPower} />
            )}
        </Card>
    );
};
