import { Translation } from '@suite/intl';
import { type RewardDto } from '@suite-common/earn-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Icon, Row, Text } from '@trezor/components';

import { VaultTokenLogo } from 'src/components/earn/common/VaultTokenLogo';
import { getApyPercent } from 'src/components/earn/utils/earnApyUtils';

type EarnYieldApyBreakdownProps = {
    rewards: RewardDto[];
    networkSymbol: NetworkSymbol;
};

const sortRewards = (rewards: RewardDto[]) =>
    rewards.toSorted((a, b) => {
        if (a.yieldSource === 'vault') return -1;
        if (b.yieldSource === 'vault') return 1;

        return b.rate - a.rate;
    });

export const EarnYieldApyBreakdown = ({ rewards, networkSymbol }: EarnYieldApyBreakdownProps) => (
    <Column gap={16} padding={{ vertical: 10, horizontal: 8 }}>
        {sortRewards(rewards).map((reward, index) => {
            const ratePercent = getApyPercent(reward.rate);

            return (
                <Row key={index} gap={8} alignItems="center">
                    <VaultTokenLogo
                        token={reward.token}
                        networkSymbol={networkSymbol}
                        size={20}
                        showNetworkIcon
                    />
                    <Column flex="1">
                        <Text typographyStyle="body-sm">{reward.token.symbol}</Text>
                        {reward.description && (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                {reward.description}
                            </Text>
                        )}
                        {!reward.description &&
                            (reward.yieldSource === 'protocol_incentive' ||
                                reward.yieldSource === 'points') && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_EARN_YIELD_APY_SOURCE_PROTOCOL_INCENTIVE" />
                                </Text>
                            )}
                        {!reward.description &&
                            reward.yieldSource !== 'protocol_incentive' &&
                            reward.yieldSource !== 'points' && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_EARN_YIELD_APY_SOURCE_LENDING_INTEREST" />
                                </Text>
                            )}
                    </Column>
                    {ratePercent !== null && ratePercent > 0 && (
                        <Text typographyStyle="body-sm" intent="brand">
                            +{ratePercent}%
                        </Text>
                    )}
                </Row>
            );
        })}
        <Row gap={4} alignItems="center" margin={{ top: 4 }}>
            <Icon name="chartLine" size={14} intent="neutral" priority="secondary" />
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_YIELD_APY_TOOLTIP_FOOTER" />
            </Text>
        </Row>
    </Column>
);
