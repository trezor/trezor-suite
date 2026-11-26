import { useRef } from 'react';

import { events } from '@suite-common/analytics';
import {
    type RewardDtoV2,
    type YieldDtoV2,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { type BottomSheetModalRef } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';

import { EarnRateBreakdownBottomSheet } from '../earn/EarnRateBreakdownBottomSheet';
import { EarnRateBreakdownRow } from '../earn/EarnRateBreakdownRow';

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

type RewardRowProps = {
    reward: RewardDtoV2;
    networkSymbol: NetworkSymbol;
    tokenSymbol: string;
};

const RewardRow = ({ reward, networkSymbol, tokenSymbol }: RewardRowProps) => {
    const { PercentageFormatter } = useFormatters();
    const rewardRatePercent = getApyPercent(reward.rate);
    const rewardSymbol = reward.token.symbol || reward.token.name || '';
    const descriptionKey = getYieldApyBreakdownDescriptionKey(reward.yieldSource);

    const rateTranslationId = getRateTranslationId(reward.yieldSource);

    return (
        <EarnRateBreakdownRow
            icon={
                <TokenIcon
                    networkSymbol={networkSymbol}
                    contractAddress={reward.token.address}
                    tokenSymbol={rewardSymbol}
                    size="extraSmall"
                    showNetworkIcon
                />
            }
            symbol={rewardSymbol}
            description={
                descriptionKey && <Translation id={descriptionKey} values={{ tokenSymbol }} />
            }
            value={
                rewardRatePercent !== null && rewardRatePercent > 0 ? (
                    <>
                        +{PercentageFormatter.format(rewardRatePercent, { withSymbol: true })}
                        {rateTranslationId && (
                            <>
                                {' '}
                                <Translation id={rateTranslationId} />
                            </>
                        )}
                    </>
                ) : undefined
            }
        />
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

    if (!vault?.outputToken?.name) return null;

    const networkSymbol = account.symbol;
    const rewards = vault.rewardRate.components;
    const underlyingToken = vault.token;
    const tokenSymbol = vault.token.symbol;

    const sortedRewards = sortRewardsByUnderlyingToken(rewards, underlyingToken);
    const hasAprReward = !!sortedRewards.some(isAprReward);

    return (
        <EarnRateBreakdownBottomSheet
            ref={ref}
            title={vault.outputToken.name}
            onClose={onClose}
            onDismiss={handleDismiss}
            bottomSheetCustomProps={{ onChange: handleSheetChange }}
            testID="@account-detail/stablecoin-yield/apy-breakdown-sheet"
            footer={
                <Translation
                    id={
                        hasAprReward
                            ? 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footerApyApr'
                            : 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footerApy'
                    }
                />
            }
        >
            {sortedRewards.map((reward, index) => (
                <RewardRow
                    key={`${reward.token.symbol}-${reward.yieldSource}-${index}`}
                    reward={reward}
                    networkSymbol={networkSymbol}
                    tokenSymbol={tokenSymbol}
                />
            ))}
        </EarnRateBreakdownBottomSheet>
    );
};
