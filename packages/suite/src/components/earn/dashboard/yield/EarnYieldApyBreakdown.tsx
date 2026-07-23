import { Translation, type TranslationKey } from '@suite/intl';
import {
    type RewardDtoV2,
    type TokenDtoV2,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getApyPercent } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { ChartLineIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

type EarnYieldApyBreakdownProps = {
    rewards: RewardDtoV2[];
    networkSymbol: NetworkSymbol;
    underlyingToken: TokenDtoV2 | undefined;
};

// Translatable explainer rendered as the secondary text of a reward row. Unknown sources return
// null so we never render the raw, untranslated description coming from the API.
const getYieldSourceDescriptionId = (
    yieldSource: RewardDtoV2['yieldSource'],
): TranslationKey | null => {
    switch (yieldSource) {
        case 'lending':
            return 'TR_EARN_YIELD_APY_SOURCE_LENDING_INTEREST';
        case 'protocol_incentive':
        case 'campaign_incentive':
            return 'TR_EARN_YIELD_APY_SOURCE_PROTOCOL_INCENTIVE';
        default:
            return null;
    }
};

// The compounded native yield is quoted as APY; incentive rewards are simple, non-compounded APR.
const getRateTranslationId = (yieldSource: RewardDtoV2['yieldSource']): TranslationKey | null => {
    switch (yieldSource) {
        case 'lending':
            return 'TR_EARN_YIELD_RATE_APY';
        case 'protocol_incentive':
        case 'campaign_incentive':
            return 'TR_EARN_YIELD_RATE_APR';
        default:
            return null;
    }
};

const isAprReward = (reward: RewardDtoV2): boolean => {
    const ratePercent = getApyPercent(reward.rate);

    return (
        getRateTranslationId(reward.yieldSource) === 'TR_EARN_YIELD_RATE_APR' &&
        ratePercent !== null &&
        ratePercent > 0
    );
};

export const EarnYieldApyBreakdown = ({
    rewards,
    networkSymbol,
    underlyingToken,
}: EarnYieldApyBreakdownProps) => {
    const sortedRewards = sortRewardsByUnderlyingToken(rewards, underlyingToken);
    // Only mention APR in the footer when a row actually shows an APR rate.
    const footerId = sortedRewards.some(isAprReward)
        ? 'TR_EARN_YIELD_APY_APR_TOOLTIP_FOOTER'
        : 'TR_EARN_YIELD_APY_TOOLTIP_FOOTER';

    return (
        <Column gap={16} padding={{ vertical: 10, horizontal: 8 }}>
            {sortedRewards.map((reward, index) => {
                const ratePercent = getApyPercent(reward.rate);
                const hasRatePercent = ratePercent !== null && ratePercent > 0;
                const descriptionId = getYieldSourceDescriptionId(reward.yieldSource);
                const rateTranslationId = getRateTranslationId(reward.yieldSource);

                let rateNode;
                if (!hasRatePercent) {
                    rateNode = <Translation id="TR_EARN_APY_N_A" />;
                } else if (rateTranslationId) {
                    rateNode = (
                        <Translation id={rateTranslationId} values={{ rate: ratePercent }} />
                    );
                } else {
                    rateNode = <>+{ratePercent}%</>;
                }

                return (
                    <Row key={index} gap={8} alignItems="center">
                        <TokenIcon
                            placeholder={reward.token.symbol || reward.token.name || 'token'}
                            symbol={networkSymbol}
                            contractAddress={reward.token.address}
                            showNetworkIcon
                            size={20}
                            isBordered={false}
                        />
                        <Column flex="1">
                            <Text
                                data-testid="@earn/dashboard/apy-breakdown/symbol"
                                typographyStyle="body-sm"
                            >
                                {reward.token.symbol}
                            </Text>
                            {descriptionId && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    isInverse
                                    data-testid="@earn/dashboard/apy-breakdown/description"
                                >
                                    <Translation id={descriptionId} />
                                </Text>
                            )}
                        </Column>
                        <Text
                            typographyStyle="body-sm"
                            intent={hasRatePercent ? 'brand' : 'neutral'}
                            priority={hasRatePercent ? 'primary' : 'secondary'}
                            isInverse
                            data-testid="@earn/dashboard/apy-breakdown/rate-percent"
                        >
                            {rateNode}
                        </Text>
                    </Row>
                );
            })}
            <Row gap={4} alignItems="center" margin={{ top: 4 }}>
                <Icon
                    as={ChartLineIcon}
                    size={14}
                    intent="neutral"
                    priority="secondary"
                    isInverse
                />
                <Text
                    data-testid="@earn/dashboard/apy-breakdown/footer"
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    isInverse
                >
                    <Translation id={footerId} />
                </Text>
            </Row>
        </Column>
    );
};
