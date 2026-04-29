import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkByEvmChainId } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row, Spinner, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldRewardItem } from './YieldRewardItem';
import { type MerkleRewardWithFiat } from '../../dashboard/yield/hooks/useMerkleRewards';

type YieldRewardsListProps = {
    rewards: MerkleRewardWithFiat[];
    isLoading: boolean;
};

export const YieldRewardsList = ({ rewards, isLoading }: YieldRewardsListProps) => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    if (isLoading) {
        return (
            <Row justifyContent="center">
                <Spinner size={24} />
            </Row>
        );
    }

    if (rewards.length === 0) {
        return (
            <Text intent="neutral" priority="secondary">
                <Translation id="TR_EARN_REWARDS_ARE_EMPTY" />
            </Text>
        );
    }

    return (
        <Column gap={16} hasDivider>
            {rewards.map((reward, index) => {
                const network = getNetworkByEvmChainId(reward.token.chainId);
                const claimableUnits = subunitsToUnits({
                    value: asAmountSubunit(new BigNumber(reward.claimable)),
                    decimals: reward.token.decimals,
                });
                const formattedAmount = CryptoAmountFormatter.format(claimableUnits.toString(), {
                    symbol: toTokenSymbol(reward.token.symbol),
                    withSymbol: false,
                    isBalance: true,
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
                        networkSymbol={network?.symbol}
                    />
                );
            })}
        </Column>
    );
};
