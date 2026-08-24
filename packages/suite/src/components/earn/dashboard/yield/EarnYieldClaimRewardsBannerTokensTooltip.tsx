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

interface EarnYieldClaimRewardsBannerTokensTooltipProps {
    rewards: TokenRewards;
    currency: BaseCurrencyCode;
}

export const EarnYieldClaimRewardsBannerTokensTooltip = ({
    rewards,
    currency,
}: EarnYieldClaimRewardsBannerTokensTooltipProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (rewards.length === 0) return null;

    const networkSymbols = [...new Set(rewards.map(({ networkSymbol }) => networkSymbol))];

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
                <Row gap={2}>
                    {networkSymbols.map(networkSymbol => (
                        <TokenIconSet
                            key={networkSymbol}
                            symbol={networkSymbol}
                            tokens={rewards
                                .filter(reward => reward.networkSymbol === networkSymbol)
                                .map(({ symbol, contractAddress }) => ({
                                    symbol,
                                    contract: contractAddress,
                                }))}
                            size={20}
                            gap={14}
                        />
                    ))}
                </Row>
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
