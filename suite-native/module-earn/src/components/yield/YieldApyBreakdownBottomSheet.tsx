import { useMemo, useRef } from 'react';

import { events } from '@suite-common/analytics';
import { yieldRewardsToTokenMetadataSources } from '@suite-common/earn-stablecoin';
import {
    type RewardDtoV2,
    type YieldDtoV2,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/networks';
import { TokenMetadataProvider } from '@suite-common/token';
import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { AssetIcon, AssetSymbol } from '@suite-native/assets';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, tokenIconSizes } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';

const getYieldApyBreakdownDescriptionKey = (
    yieldSource: RewardDtoV2['yieldSource'],
): TxKeyPath | null => {
    switch (yieldSource) {
        case 'protocol_incentive':
        case 'campaign_incentive':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.manualCompound';
        default:
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.autoCompounded';
    }
};

const getRateTranslationId = (yieldSource: RewardDtoV2['yieldSource']): TxKeyPath | null => {
    switch (yieldSource) {
        case 'lending':
            return 'earn.apyAbbr';
        case 'protocol_incentive':
        case 'campaign_incentive':
            return 'earn.aprAbbr';
        default:
            return null;
    }
};

const isAprReward = (reward: RewardDtoV2): boolean => {
    const ratePercent = getApyPercent(reward.rate);

    return (
        getRateTranslationId(reward.yieldSource) === 'earn.aprAbbr' &&
        ratePercent !== null &&
        ratePercent > 0
    );
};

const toContractAddress = (address: string | undefined) =>
    address ? toTokenAddress(address) : undefined;

type RewardRowProps = {
    reward: RewardDtoV2;
    networkSymbol: NetworkSymbol;
    vaultTokenContract: TokenAddress | undefined;
};

const RewardRow = ({ reward, networkSymbol, vaultTokenContract }: RewardRowProps) => {
    const { PercentageFormatter } = useFormatters();
    const rewardRatePercent = getApyPercent(reward.rate);
    const rewardContract = toContractAddress(reward.token.address);
    const descriptionKey = getYieldApyBreakdownDescriptionKey(reward.yieldSource);

    const rateTranslationId = getRateTranslationId(reward.yieldSource);

    return (
        <HStack spacing="sp8" alignItems="center">
            <Box flex={1}>
                <VStack spacing={0}>
                    <HStack justifyContent="space-between">
                        <HStack alignItems="center">
                            <AssetIcon
                                networkSymbol={networkSymbol}
                                contractAddress={rewardContract}
                                size="extraSmall"
                                showNetworkIcon
                                wrappedTokenIcon="network"
                            />

                            <AssetSymbol
                                variant="body-md"
                                networkSymbol={networkSymbol}
                                contractAddress={rewardContract}
                                isWrappedNativeShownAsNative
                            />
                        </HStack>

                        {rewardRatePercent !== null && rewardRatePercent > 0 && (
                            <Text variant="body-md" color="contentBrand">
                                +
                                {PercentageFormatter.format(rewardRatePercent, {
                                    withSymbol: true,
                                })}
                                {rateTranslationId && (
                                    <>
                                        {' '}
                                        <Translation id={rateTranslationId} />
                                    </>
                                )}
                            </Text>
                        )}
                    </HStack>

                    {descriptionKey && (
                        <Box style={{ marginLeft: tokenIconSizes.extraSmall }} paddingLeft="sp8">
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation
                                    id={descriptionKey}
                                    values={{
                                        tokenSymbol: (
                                            <AssetSymbol
                                                variant="body-sm"
                                                color="contentSecondary"
                                                networkSymbol={networkSymbol}
                                                contractAddress={vaultTokenContract}
                                                isWrappedNativeShownAsNative
                                            />
                                        ),
                                    }}
                                />
                            </Text>
                        </Box>
                    )}
                </VStack>
            </Box>
        </HStack>
    );
};

type YieldApyBreakdownBottomSheetProps = {
    ref: BottomSheetModalRef;
    onClose: () => void;
    account: Account;
    vault?: YieldDtoV2 | null;
};

export const YieldApyBreakdownBottomSheet = ({
    ref,
    onClose,
    account,
    vault,
}: YieldApyBreakdownBottomSheetProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const hasReportedPresentationRef = useRef(false);
    const handleDismiss = () => {
        hasReportedPresentationRef.current = false;
    };
    const handleSheetChange = (index: number) => {
        if (index < 0) {
            handleDismiss();

            return;
        }
        if (hasReportedPresentationRef.current || !vault) return;
        hasReportedPresentationRef.current = true;
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: { element: 'apy-tooltip', networkSymbol: account.symbol, vaultId: vault.id },
        });
    };

    const networkSymbol = account.symbol;
    const rewards = vault?.rewardRate.components;
    // The sheet renders in a portal, so it provides the reward tokens itself.
    const metadataSources = useMemo(
        () => yieldRewardsToTokenMetadataSources({ networkSymbol, rewards: rewards ?? [] }),
        [networkSymbol, rewards],
    );

    if (!vault?.outputToken?.name || !rewards) return null;

    const underlyingToken = vault.token;

    const sortedRewards = sortRewardsByUnderlyingToken(rewards, underlyingToken);
    const hasAprReward = !!sortedRewards.some(isAprReward);

    return (
        <BottomSheetModal
            ref={ref}
            title={vault.outputToken?.name}
            isCloseDisplayed
            onClose={onClose}
            onDismiss={handleDismiss}
            bottomSheetCustomProps={{ onChange: handleSheetChange }}
        >
            <TokenMetadataProvider sources={metadataSources}>
                <Box testID="@account-detail/stablecoin-yield/apy-breakdown-sheet">
                    <VStack spacing="sp20">
                        {sortedRewards.map((reward, index) => (
                            <RewardRow
                                key={`${reward.token.symbol}-${reward.yieldSource}-${index}`}
                                reward={reward}
                                networkSymbol={networkSymbol}
                                vaultTokenContract={toContractAddress(underlyingToken.address)}
                            />
                        ))}

                        <HStack spacing="sp8" alignItems="center">
                            <Icon name="arrowsDownUp" size="medium" color="contentSecondary" />

                            <Text variant="body-md" color="contentSecondary">
                                <Translation
                                    id={
                                        hasAprReward
                                            ? 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footerApyApr'
                                            : 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footerApy'
                                    }
                                />
                            </Text>
                        </HStack>
                    </VStack>
                </Box>
            </TokenMetadataProvider>
        </BottomSheetModal>
    );
};
