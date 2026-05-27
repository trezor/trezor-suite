import { Translation } from '@suite/intl';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldRewardItem } from './YieldRewardItem';

type YieldFlowCompleteClaimProps = {
    accountRewards: YieldAccountRewards;
};

export const YieldFlowCompleteClaim = ({ accountRewards }: YieldFlowCompleteClaimProps) => {
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

                <Column gap={16}>
                    {accountRewards.rewards.map((reward, index) => {
                        const claimableUnits = subunitsToUnits({
                            value: asAmountSubunit(new BigNumber(reward.claimable)),
                            decimals: reward.token.decimals,
                        });
                        const formattedAmount = CryptoAmountFormatter.format(
                            claimableUnits.toString(),
                            {
                                symbol: toTokenSymbol(reward.token.symbol),
                                withSymbol: false,
                                isBalance: true,
                                maxDisplayedDecimals: reward.token.decimals,
                                isEllipsisAppended: false,
                            },
                        );
                        const formattedFiatAmount = reward.fiat.claimable
                            ? BaseCurrencyAmountFormatter.format(
                                  asBaseCurrencyAmount(new BigNumber(reward.fiat.claimable)),
                              )
                            : null;

                        return (
                            <YieldRewardItem
                                key={`${reward.token.address}:${index}`}
                                formattedAmount={formattedAmount}
                                formattedFiatAmount={formattedFiatAmount}
                                tokenSymbol={reward.token.symbol}
                                tokenAddress={reward.token.address}
                                networkSymbol={accountRewards.account.symbol}
                            />
                        );
                    })}
                </Column>
            </Column>
        </YieldFlowComplete>
    );
};
