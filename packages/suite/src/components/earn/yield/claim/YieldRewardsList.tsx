import { Translation } from '@suite/intl';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row, Spinner, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldRewardItem } from '../common/YieldRewardItem';

type YieldRewardsListProps = {
    accountRewards?: YieldAccountRewards;
    isLoading: boolean;
};

export const YieldRewardsList = ({ accountRewards, isLoading }: YieldRewardsListProps) => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    if (isLoading) {
        return (
            <Row justifyContent="center">
                <Spinner size={24} />
            </Row>
        );
    }

    if (!accountRewards || accountRewards.rewards.length === 0) {
        return (
            <Text intent="neutral" priority="secondary">
                <Translation id="TR_EARN_REWARDS_ARE_EMPTY" />
            </Text>
        );
    }

    return (
        <Column gap={16}>
            {accountRewards.rewards.map((reward, index) => {
                const claimableUnits = subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(reward.claimable)),
                    decimals: reward.token.decimals,
                });
                const formattedAmount = CryptoAmountFormatter.format(claimableUnits.toString(), {
                    symbol: toTokenSymbol(reward.token.symbol),
                    withSymbol: false,
                    isBalance: true,
                    maxDisplayedDecimals: reward.token.decimals,
                    isEllipsisAppended: false,
                });
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
    );
};
