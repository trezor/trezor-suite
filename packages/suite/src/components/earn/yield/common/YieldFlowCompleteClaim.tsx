import { Translation } from '@suite/intl';
import { getYieldClaimFeedbackContext } from '@suite-common/feedback';
import { useFormatters } from '@suite-common/formatters';
import { toTokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldRewardItem } from './YieldRewardItem';

type YieldFlowCompleteClaimProps = {
    rewards: YieldFlowCompleteRewardItem[];
    networkSymbol: NetworkSymbol;
};

export const YieldFlowCompleteClaim = ({ rewards, networkSymbol }: YieldFlowCompleteClaimProps) => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    return (
        <YieldFlowComplete
            type="claim"
            feedbackContext={getYieldClaimFeedbackContext(rewards, networkSymbol)}
            heading={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE" />}
            description={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE_DESCRIPTION" />}
        >
            <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_BONUS_REWARDS" />
                </Text>

                <Column gap={16} data-testid="@yield/flow-complete/rewards-list">
                    {rewards.map((reward, index) => {
                        const formattedAmount = CryptoAmountFormatter.format(reward.value, {
                            symbol: toTokenSymbol(reward.token.symbol),
                            withSymbol: false,
                            isBalance: true,
                            maxDisplayedDecimals: reward.token.decimals,
                            isEllipsisAppended: false,
                        });
                        const formattedFiatAmount = reward.fiatValue
                            ? BaseCurrencyAmountFormatter.format(
                                  asBaseCurrencyAmount(new BigNumber(reward.fiatValue)),
                              )
                            : null;

                        return (
                            <YieldRewardItem
                                key={`${reward.token.contractAddress}:${index}`}
                                formattedAmount={formattedAmount}
                                formattedFiatAmount={formattedFiatAmount}
                                tokenSymbol={reward.token.symbol}
                                tokenAddress={reward.token.contractAddress}
                                networkSymbol={reward.token.networkSymbol}
                            />
                        );
                    })}
                </Column>
            </Column>
        </YieldFlowComplete>
    );
};
