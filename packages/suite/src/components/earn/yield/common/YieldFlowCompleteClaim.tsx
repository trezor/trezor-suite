import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldRewardItem } from './YieldRewardItem';

type YieldFlowCompleteClaimProps = {
    rewards: YieldFlowCompleteRewardItem[];
};

export const YieldFlowCompleteClaim = ({ rewards }: YieldFlowCompleteClaimProps) => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    return (
        <YieldFlowComplete
            type="claim"
            heading={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE" />}
            description={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE_DESCRIPTION" />}
        >
            <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_STAKE_REWARDS" />
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
