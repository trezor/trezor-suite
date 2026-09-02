import { Fragment } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Grid, Row, Text, Tooltip } from '@trezor/components';
import { TokenIconSet } from '@trezor/product-components';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';

import { type TokenRewards } from './hooks/useYieldClaimRewardsData';

const TooltipLabel = styled.span`
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

const TokenIconStack = styled.span`
    display: inline-flex;
    align-items: center;
`;

const OverflowBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: -8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.elementFillContrast};
`;

const MAX_TOKEN_ICONS_WITHOUT_OVERFLOW = 3;
const MAX_VISIBLE_TOKEN_ICONS_WITH_OVERFLOW = 2;

interface EarnYieldClaimRewardsBannerTokensTooltipProps {
    rewards: TokenRewards;
    currency: BaseCurrencyCode;
}

export const EarnYieldClaimRewardsBannerTokensTooltip = ({
    rewards,
    currency,
}: EarnYieldClaimRewardsBannerTokensTooltipProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const firstReward = rewards[0];

    if (!firstReward) return null;

    const hasOverflow = rewards.length > MAX_TOKEN_ICONS_WITHOUT_OVERFLOW;
    const maxVisibleTokenIcons = hasOverflow
        ? MAX_VISIBLE_TOKEN_ICONS_WITH_OVERFLOW
        : MAX_TOKEN_ICONS_WITHOUT_OVERFLOW;

    const trigger = (
        <Row
            as="span"
            display="inline-flex"
            gap={6}
            cursor={rewards.length === 1 ? 'default' : 'help'}
        >
            <TokenIconStack>
                <TokenIconSet
                    symbol={firstReward.networkSymbol}
                    tokens={rewards.map(({ symbol, networkSymbol, contractAddress }) => ({
                        symbol,
                        networkSymbol,
                        contract: contractAddress,
                    }))}
                    size={20}
                    gap={12}
                    maxVisibleIcons={maxVisibleTokenIcons}
                    isTransparent
                />
                {hasOverflow && (
                    <OverflowBadge>
                        <Text typographyStyle="body-xs" color="contentPrimaryInverse">
                            +{rewards.length - maxVisibleTokenIcons}
                        </Text>
                    </OverflowBadge>
                )}
            </TokenIconStack>
            {rewards.length === 1 ? (
                <Text intent="neutral" priority="secondary">
                    {firstReward.symbol}
                </Text>
            ) : (
                <TooltipLabel>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EARN_CLAIM_REWARDS_TOKENS_COUNT"
                            values={{ tokens: rewards.length }}
                        />
                    </Text>
                </TooltipLabel>
            )}
        </Row>
    );

    if (rewards.length === 1) {
        return trigger;
    }

    return (
        <Tooltip
            as="span"
            display="inline-flex"
            width="auto"
            content={
                <Grid columns="auto auto" rowGap={4} columnGap={24}>
                    {rewards.map(({ symbol, networkSymbol, contractAddress, crypto, fiat }) => (
                        <Fragment key={`${networkSymbol}-${contractAddress}`}>
                            <Text>
                                <FormattedCryptoAmount value={crypto.toString()} symbol={symbol} />
                            </Text>

                            <HiddenPlaceholder>
                                <Text align="end">
                                    <BaseCurrencyAmountFormatter
                                        value={asBaseCurrencyAmount(fiat)}
                                        currency={currency}
                                    />
                                </Text>
                            </HiddenPlaceholder>
                        </Fragment>
                    ))}
                </Grid>
            }
        >
            {trigger}
        </Tooltip>
    );
};
