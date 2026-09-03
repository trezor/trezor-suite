import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { CARDANO_EPOCH_DAYS, isSupportedSolStakingNetworkSymbol } from '@suite-common/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectEthNextRewardPayout } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    Badge,
    BannerInline,
    Button,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    selectApy,
    selectIsCardanoStakedWithFiveBinaries,
    selectStakedBalanceByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { CardanoAutoStakedModal } from './CardanoAutoStakedModal';
import { useMessageSystemStaking } from '../../hooks/staking/useMessageSystemStaking';
import { useStakingTotalRewards } from '../../hooks/staking/useStakingTotalRewards';
import { ApyValue } from '../earn/ApyValue';
import { useEarnPortfolioTrackerGuard } from '../earn/EarnPortfolioTrackerGuard';

type StakingManagementStakedCardProps = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
};

type StakedSectionStyleProps = {
    hasBottomBorder: boolean;
};

const stakedSectionStyle = prepareNativeStyle<StakedSectionStyleProps>(
    (utils, { hasBottomBorder }) => ({
        padding: utils.spacings.sp16,
        extend: {
            condition: hasBottomBorder,
            style: {
                borderBottomWidth: utils.borders.widths.small,
                borderBottomColor: utils.colors.borderNeutral,
            },
        },
    }),
);

const buttonsRowStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    gap: utils.spacings.sp12,
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const StakingManagementStakedCard = ({
    accountKey,
    networkSymbol,
}: StakingManagementStakedCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { isPortfolioTrackerDevice, openPortfolioTrackerSheet } = useEarnPortfolioTrackerGuard();
    const navigation = useNavigation<NavigationProp>();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const { bottomSheetRef: autoStakedModalRef, openModal: openAutoStakedModal } =
        useBottomSheetModal();

    const isSolanaStaking = isSupportedSolStakingNetworkSymbol(networkSymbol);
    const isCardanoStaking = networkSymbol === 'ada';
    const areStakeActionsShown = !isCardanoStaking;

    const handleStake = () => {
        if (isPortfolioTrackerDevice) {
            openPortfolioTrackerSheet();

            return;
        }

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol,
            },
        });
        navigation.navigate(RootStackRoutes.HowStakeWorksScreen, {
            accountKey,
            symbol: networkSymbol,
        });
    };

    const handleUnstake = () => {
        if (isPortfolioTrackerDevice) {
            openPortfolioTrackerSheet();

            return;
        }

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol,
            },
        });
        navigation.navigate(RootStackRoutes.UnstakeFlow, { accountKey });
    };

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));
    const hasStakedBalance = new BigNumber(stakedBalance ?? '0').gt(0);
    const { totalRewards, isTotalRewardsLoading } = useStakingTotalRewards(accountKey);

    const apy = useSelector(state => selectApy(state, { accountKey, networkSymbol }));
    const isAdaStakedWithFiveBinaries = useSelector(state =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );
    const nextRewardPayout = useSelector(selectEthNextRewardPayout);
    const isNotEarning = isCardanoStaking && isAdaStakedWithFiveBinaries;

    let rewardsFrequencyInDays = null;
    if (isCardanoStaking) {
        rewardsFrequencyInDays = CARDANO_EPOCH_DAYS;
    } else if (isSolanaStaking) {
        rewardsFrequencyInDays = SOLANA_EPOCH_DAYS;
    }

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
    } = useMessageSystemStaking(networkSymbol);

    return (
        <>
            <Card noPadding>
                <VStack
                    spacing="sp4"
                    style={applyStyle(stakedSectionStyle, { hasBottomBorder: true })}
                >
                    <HStack alignItems="center" justifyContent="space-between">
                        <HStack alignItems="center" spacing="sp8">
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="earn.stakingManagementScreen.stakedLabel" />
                            </Text>
                            {isCardanoStaking && (
                                <Badge
                                    label={
                                        <Translation id="earn.stakingManagementScreen.cardanoAutoStakedBadge" />
                                    }
                                    intent="brand"
                                    size="small"
                                />
                            )}
                        </HStack>
                        {isCardanoStaking && (
                            <PressableOpacity onPress={openAutoStakedModal}>
                                <Text variant="body-sm" color="contentBrand">
                                    <Translation id="earn.stakingManagementScreen.cardanoLearnMoreLink" />
                                </Text>
                            </PressableOpacity>
                        )}
                    </HStack>
                    <CryptoAmountFormatter
                        value={stakedBalance}
                        symbol={networkSymbol}
                        variant="headline-sm"
                        color="contentPrimary"
                    />
                    <CryptoToFiatAmountFormatter
                        value={stakedBalance}
                        symbol={networkSymbol}
                        color="contentSecondary"
                        isBalance
                    />
                </VStack>
                <VStack
                    spacing="sp4"
                    style={applyStyle(stakedSectionStyle, { hasBottomBorder: true })}
                >
                    <HStack alignItems="center" spacing="sp4">
                        <Text variant="body-md" color="contentSecondary">
                            <Translation
                                id={
                                    isCardanoStaking
                                        ? 'earn.rewards'
                                        : 'earn.stakingManagementScreen.totalRewardsLabel'
                                }
                            />
                        </Text>
                        {!isCardanoStaking && (
                            <Badge
                                label={
                                    <Translation id="earn.stakingManagementScreen.autoRestakedBadge" />
                                }
                                intent="brand"
                                size="small"
                            />
                        )}
                    </HStack>
                    <CryptoAmountFormatter
                        value={totalRewards}
                        symbol={networkSymbol}
                        variant="headline-sm"
                        color="contentPrimary"
                        isLoading={isTotalRewardsLoading}
                    />
                    <CryptoToFiatAmountFormatter
                        value={totalRewards}
                        symbol={networkSymbol}
                        color="contentSecondary"
                        isBalance
                        isLoading={isTotalRewardsLoading}
                    />
                </VStack>
                <HStack
                    justifyContent="space-between"
                    style={applyStyle(stakedSectionStyle, {
                        hasBottomBorder: areStakeActionsShown,
                    })}
                >
                    <Text variant="body-sm">
                        <ApyValue
                            apy={apy}
                            isNotEarning={isNotEarning}
                            withLabel={isCardanoStaking || apy != null}
                        />
                    </Text>
                    {rewardsFrequencyInDays !== null ? (
                        <Text variant="body-sm">
                            <Translation
                                id="earn.stakingManagementScreen.rewardsFrequencyLabel"
                                values={{ value: rewardsFrequencyInDays }}
                            />
                        </Text>
                    ) : (
                        nextRewardPayout != null && (
                            <Text variant="body-sm">
                                <Translation
                                    id="earn.stakingManagementScreen.nextRewardLabel"
                                    values={{ value: nextRewardPayout }}
                                />
                            </Text>
                        )
                    )}
                </HStack>
                {areStakeActionsShown && (
                    <VStack style={applyStyle(buttonsRowStyle)}>
                        {isUnstakingDisabled && unstakingMessageContent && (
                            <BannerInline intent="warning" title={unstakingMessageContent} />
                        )}
                        {isStakingDisabled && stakingMessageContent && (
                            <BannerInline intent="warning" title={stakingMessageContent} />
                        )}
                        <HStack spacing="sp12">
                            <Button
                                flex={1}
                                priority="secondary"
                                onPress={handleStake}
                                isDisabled={isStakingDisabled}
                            >
                                <Translation
                                    id={
                                        hasStakedBalance
                                            ? 'earn.stakingManagementScreen.stakeMoreButton'
                                            : 'earn.stakingManagementScreen.stakeButton'
                                    }
                                />
                            </Button>
                            {hasStakedBalance && (
                                <Button
                                    flex={1}
                                    priority="secondary"
                                    onPress={handleUnstake}
                                    isDisabled={isUnstakingDisabled}
                                >
                                    <Translation id="earn.stakingManagementScreen.unstakeButton" />
                                </Button>
                            )}
                        </HStack>
                    </VStack>
                )}
            </Card>
            {isCardanoStaking && (
                <CardanoAutoStakedModal ref={autoStakedModalRef} networkSymbol={networkSymbol} />
            )}
        </>
    );
};
