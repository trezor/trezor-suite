import { Translation, type TranslationKey } from '@suite/intl';
import {
    type RewardDtoV2,
    type TokenDtoV2,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getApyPercent } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

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

export const EarnYieldApyBreakdown = ({
    rewards,
    networkSymbol,
    underlyingToken,
}: EarnYieldApyBreakdownProps) => (
    <Column gap={16} padding={{ vertical: 10, horizontal: 8 }}>
        {sortRewardsByUnderlyingToken(rewards, underlyingToken).map((reward, index) => {
            const ratePercent = getApyPercent(reward.rate);
            const hasRatePercent = ratePercent !== null && ratePercent > 0;
            const descriptionId = getYieldSourceDescriptionId(reward.yieldSource);

            return (
                <Row key={index} gap={8} alignItems="center">
                    <AssetLogo
                        placeholder={reward.token.symbol || reward.token.name || 'token'}
                        symbol={networkSymbol}
                        contractAddress={reward.token.address}
                        showNetworkIcon
                        size={20}
                        isBordered={false}
                    />
                    <Column flex="1">
                        <Text typographyStyle="body-sm">{reward.token.symbol}</Text>
                        {descriptionId && (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id={descriptionId} />
                            </Text>
                        )}
                    </Column>
                    <Text
                        typographyStyle="body-sm"
                        intent={hasRatePercent ? 'brand' : 'neutral'}
                        priority={hasRatePercent ? 'primary' : 'secondary'}
                    >
                        {hasRatePercent ? (
                            <>+{ratePercent}%</>
                        ) : (
                            <>
                                <Translation id="TR_EARN_APY_N_A" />{' '}
                                <Translation id="TR_STAKE_APY_ABBR" />
                            </>
                        )}
                    </Text>
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
