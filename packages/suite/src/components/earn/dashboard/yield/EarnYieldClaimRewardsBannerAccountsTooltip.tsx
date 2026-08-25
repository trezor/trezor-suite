import { Fragment } from 'react';

import styled from 'styled-components';

import { AccountLabel } from '@suite/account';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Grid, Icon, Row, Text, Tooltip } from '@trezor/components';
import { WalletIcon } from '@trezor/icons';

import { type AccountRewards } from './hooks/useYieldClaimRewardsData';

const TooltipLabel = styled.span`
    text-decoration: underline dotted ${({ theme }) => theme.contentSecondary};
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
`;

interface EarnYieldClaimRewardsBannerAccountsTooltipProps {
    rewards: AccountRewards;
    currency: BaseCurrencyCode;
}

export const EarnYieldClaimRewardsBannerAccountsTooltip = ({
    rewards,
    currency,
}: EarnYieldClaimRewardsBannerAccountsTooltipProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();

    if (rewards.length === 0) return null;

    return (
        <Tooltip
            as="span"
            display="inline-flex"
            width="auto"
            content={
                <Grid columns="auto auto" rowGap={4} columnGap={24}>
                    {rewards.map(({ account, fiat }) => (
                        <Fragment key={account.key}>
                            <Text>
                                <AccountLabel account={account} showAccountTypeBadge />
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
            <Row as="span" display="inline-flex" gap={6} cursor="help">
                <Icon as={WalletIcon} size={16} intent="neutral" priority="secondary" />
                <TooltipLabel>
                    <Text intent="neutral" priority="secondary">
                        <Translation
                            id="TR_EARN_CLAIM_REWARDS_ACCOUNTS_COUNT"
                            values={{
                                accounts: rewards.length,
                            }}
                        />
                    </Text>
                </TooltipLabel>
            </Row>
        </Tooltip>
    );
};
