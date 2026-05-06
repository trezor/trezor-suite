import { Translation, type TranslationKey } from '@suite/intl';
import {
    type RewardDto,
    type RewardDtoYieldSource,
    type TokenDto,
    sortRewardsByUnderlyingToken,
} from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { getApyPercent } from '@suite-common/wallet-utils';
import { Column, Icon, Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

type EarnYieldApyBreakdownProps = {
    rewards: RewardDto[];
    networkSymbol: NetworkSymbol;
    underlyingToken: TokenDto | undefined;
};

const getYieldSourceTranslationId = (yieldSource: RewardDtoYieldSource): TranslationKey | null => {
    switch (yieldSource) {
        case 'lending_interest':
            return 'TR_EARN_YIELD_APY_SOURCE_LENDING_INTEREST';
        case 'protocol_incentive':
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
            const translationId = getYieldSourceTranslationId(reward.yieldSource);
            const description = translationId ? (
                <Translation id={translationId} />
            ) : (
                reward.description
            );

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
                        {description && (
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                {description}
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
