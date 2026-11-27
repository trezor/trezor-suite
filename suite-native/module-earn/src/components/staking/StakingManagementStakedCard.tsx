import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountNotice,
    useNetworkStakingRate,
    useStakingAccountPosition,
    useStakingDaysUntil,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import {
    ZERO_STAKING_AMOUNT,
    getStakingPositionPrincipal,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import {
    Badge,
    BannerInline,
    Button,
    Card,
    DiscreetTextTrigger,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { useStakingOperationMessage } from '@suite-native/earn';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { CardanoAutoStakedModal } from './CardanoAutoStakedModal';
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
    const { analytics } = useServices(injectNativeAnalytics);
    const { bottomSheetRef: autoStakedModalRef, openModal: openAutoStakedModal } =
        useBottomSheetModal();

    const networkType = getNetworkType(networkSymbol);
    const isCardanoStaking = networkType === 'cardano';
    const isSolanaStaking = networkType === 'solana';

    const {
        productId,
        descriptor: productDescriptor,
        position,
        totals,
        access,
    } = useStakingAccountPosition(accountKey);

    const notice = useSelector((state: StakingRootState) =>
        selectStakingAccountNotice(state, accountKey),
    );
    const isNotEarning = notice?.kind === 'outdated-provider' || notice?.kind === 'no-stake-pool';
    const stakeMessage = useStakingOperationMessage(productId, 'stake');
    const unstakeMessage = useStakingOperationMessage(productId, 'unstake');
    const { rate, rateKind } = useNetworkStakingRate({ networkSymbol, accountKey });
    const { rewardPeriodDays, nextRewardAt } = useStakingPeriods(productId);
    const { totalRewards, isTotalRewardsLoading } = useStakingTotalRewards(accountKey);
    const nextRewardInDays = useStakingDaysUntil(nextRewardAt);

    const principal =
        position === null || productDescriptor === null
            ? ZERO_STAKING_AMOUNT
            : getStakingPositionPrincipal(position, productDescriptor.rewardsKind);

    const stakedBalance = formatStakingAmount({ amount: principal, networkSymbol });
    const hasStakedBalance = new BigNumber(principal).gt(0);
    const hasUnstakableBalance = new BigNumber(totals.staked).gt(0);

    const areStakeActionsShown = access.access === 'manage';
    const isStakeDisabled = access.disabled.stake !== undefined;
    const isUnstakeDisabled = access.disabled.unstake !== undefined;

    // Rewards that cannot be claimed on their own stay in the stake.
    const areRewardsAutoRestaked =
        productDescriptor !== null && !productDescriptor.operations.includes('claim');

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

                    <DiscreetTextTrigger>
                        <CompactCryptoAmountFormatter
                            value={stakedBalance}
                            symbol={networkSymbol}
                            variant="headline-sm"
                            color="contentPrimary"
                        />
                    </DiscreetTextTrigger>

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
                                    isSolanaStaking
                                        ? 'earn.stakingManagementScreen.totalRewardsLabel'
                                        : 'earn.rewards'
                                }
                            />
                        </Text>

                        {areRewardsAutoRestaked && (
                            <Badge
                                label={
                                    <Translation id="earn.stakingManagementScreen.autoRestakedBadge" />
                                }
                                intent="brand"
                                size="small"
                            />
                        )}
                    </HStack>

                    <CompactCryptoAmountFormatter
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
                            apy={rate}
                            isNotEarning={isNotEarning}
                            withLabel
                            rateType={rateKind ?? 'apy'}
                        />
                    </Text>

                    {rewardPeriodDays !== null ? (
                        <Text variant="body-sm">
                            <Translation
                                id="earn.stakingManagementScreen.rewardsFrequencyLabel"
                                values={{ value: rewardPeriodDays }}
                            />
                        </Text>
                    ) : (
                        nextRewardInDays !== null && (
                            <Text variant="body-sm">
                                <Translation
                                    id="earn.stakingManagementScreen.nextRewardLabel"
                                    values={{ value: nextRewardInDays }}
                                />
                            </Text>
                        )
                    )}
                </HStack>

                {areStakeActionsShown && (
                    <VStack style={applyStyle(buttonsRowStyle)}>
                        {isUnstakeDisabled && unstakeMessage !== null && (
                            <BannerInline intent="warning" title={unstakeMessage} />
                        )}

                        {isStakeDisabled && stakeMessage !== null && (
                            <BannerInline intent="warning" title={stakeMessage} />
                        )}

                        <HStack spacing="sp12">
                            <Button
                                flex={1}
                                priority="secondary"
                                onPress={handleStake}
                                isDisabled={isStakeDisabled}
                            >
                                <Translation
                                    id={
                                        hasStakedBalance
                                            ? 'earn.stakingManagementScreen.stakeMoreButton'
                                            : 'earn.stakingManagementScreen.stakeButton'
                                    }
                                />
                            </Button>

                            {hasUnstakableBalance && (
                                <Button
                                    flex={1}
                                    priority="secondary"
                                    onPress={handleUnstake}
                                    isDisabled={isUnstakeDisabled}
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
