import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type YieldFlowCompleteRewardItem } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { asAmountUnit } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldFlowComplete } from './YieldFlowComplete';
import { YieldRewardItem } from './YieldRewardItem';

type YieldFlowCompleteClaimProps = {
    rewards: YieldFlowCompleteRewardItem[];
};

export const YieldFlowCompleteClaim = ({ rewards }: YieldFlowCompleteClaimProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <YieldFlowComplete
            type="claim"
            heading={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE" />}
            description={<Translation id="TR_EARN_YIELD_CLAIM_COMPLETE_DESCRIPTION" />}
        >
            <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_BONUS_REWARDS" />
                </Text>

                <Column gap={16} data-testid="@yield/flow-complete/rewards-list">
                    {rewards.map(({ token, value, fiatValue }, index) => {
                        if (!token.contractAddress) return null;

                        const formattedFiatAmount = fiatValue
                            ? BaseCurrencyAmountFormatter.format(
                                  asBaseCurrencyAmount(new BigNumber(fiatValue)),
                              )
                            : null;

                        return (
                            <YieldRewardItem
                                key={`${token.contractAddress}:${index}`}
                                amount={asAmountUnit(new BigNumber(value))}
                                formattedFiatAmount={formattedFiatAmount}
                                networkSymbol={token.networkSymbol}
                                contractAddress={token.contractAddress}
                            />
                        );
                    })}
                </Column>
            </Column>
        </YieldFlowComplete>
    );
};
