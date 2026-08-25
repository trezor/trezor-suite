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

const MAX_VISIBLE_TOKEN_ICONS = 2;

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

    if (rewards.length === 1) {
        return (
            <Row gap={6}>
                <TokenIconSet
                    symbol={firstReward.networkSymbol}
                    tokens={[
                        {
                            symbol: firstReward.symbol,
                            networkSymbol: firstReward.networkSymbol,
                            contract: firstReward.contractAddress,
                        },
                    ]}
                    size={20}
                    gap={14}
                    maxVisibleIcons={MAX_VISIBLE_TOKEN_ICONS}
                    isCountVisible
                    isTransparent
                />
                <Text intent="neutral" priority="secondary">
                    {firstReward.symbol}
                </Text>
            </Row>
        );
    }

    return (
        <Tooltip
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
            <Row gap={6} cursor="help">
                <TokenIconSet
                    symbol={firstReward.networkSymbol}
                    tokens={rewards.map(({ symbol, networkSymbol, contractAddress }) => ({
                        symbol,
                        networkSymbol,
                        contract: contractAddress,
                    }))}
                    size={20}
                    gap={14}
                    maxVisibleIcons={MAX_VISIBLE_TOKEN_ICONS}
                    isCountVisible
                    isTransparent
                />
                <TooltipLabel>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EARN_CLAIM_REWARDS_TOKENS_LABEL"
                            values={{ tokens: rewards.length }}
                        />
                    </Text>
                </TooltipLabel>
            </Row>
        </Tooltip>
    );
};
