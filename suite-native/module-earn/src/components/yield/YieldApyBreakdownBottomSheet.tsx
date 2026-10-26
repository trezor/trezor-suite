import {
    type RewardDtoV2,
    type YieldDtoV2,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, TokenIcon, tokenIconSizes } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';

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
        getRateTranslationId(reward.yieldSource) === 'earn.apyAbbr' &&
        ratePercent !== null &&
        ratePercent > 0
    );
};

type RewardRowProps = {
    reward: RewardDtoV2;
    networkSymbol: NetworkSymbol;
    tokenSymbol: string;
};

const RewardRow = ({ reward, networkSymbol, tokenSymbol }: RewardRowProps) => {
    const rewardRatePercent = getApyPercent(reward.rate);
    const rewardSymbol = reward.token.symbol || reward.token.name || '';
    const descriptionKey = getYieldApyBreakdownDescriptionKey(reward.yieldSource);

    const rateTranslationId = getRateTranslationId(reward.yieldSource);

    return (
        <HStack spacing="sp8" alignItems="center">
            <Box flex={1}>
                <VStack spacing={0}>
                    <HStack justifyContent="space-between">
                        <HStack alignItems="center">
                            <TokenIcon
                                networkSymbol={networkSymbol}
                                contractAddress={reward.token.address}
                                tokenSymbol={rewardSymbol}
                                size="extraSmall"
                                showNetworkIcon
                            />

                            <Text variant="body-md">{rewardSymbol}</Text>
                        </HStack>

                        {rewardRatePercent !== null && rewardRatePercent > 0 && (
                            <Text variant="body-md" color="contentBrand">
                                +{rewardRatePercent.toFixed(2)}%
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
                                <Translation id={descriptionKey} values={{ tokenSymbol }} />
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
    if (!vault?.outputToken?.name) return null;

    const networkSymbol = account.symbol;
    const rewards = vault.rewardRate.components;
    const underlyingToken = vault.token;
    const tokenSymbol = vault.token.symbol;

    const sortedRewards = sortRewardsByUnderlyingToken(rewards, underlyingToken);
    const hasAprReward = !!sortedRewards.some(isAprReward);

    return (
        <BottomSheetModal
            ref={ref}
            title={vault.outputToken?.name}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box testID="@account-detail/stablecoin-yield/apy-breakdown-sheet">
                <VStack spacing="sp20">
                    {sortedRewards.map((reward, index) => (
                        <RewardRow
                            key={`${reward.token.symbol}-${reward.yieldSource}-${index}`}
                            reward={reward}
                            networkSymbol={networkSymbol}
                            tokenSymbol={tokenSymbol}
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
        </BottomSheetModal>
    );
};
