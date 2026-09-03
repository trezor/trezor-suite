import styled from 'styled-components';

import { AccountLabel } from '@suite/account';
import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type YieldAccountRewards,
    type YieldAccountsRewards,
} from '@suite-common/earn-stablecoin-api';
import { getCompactAmount, useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    compareAccountsByCoin,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { CardList, Column, Icon, Modal, Row, Text, Tooltip } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

const getRewardTokenAmounts = ({ rewards }: YieldAccountRewards) => {
    const tokenAmounts = new Map<string, { amount: BigNumber; decimals: number; symbol: string }>();

    for (const reward of rewards) {
        const claimableAmount = new BigNumber(reward.claimable);

        if (claimableAmount.lte(0)) continue;

        const tokenKey = reward.token.address.toLowerCase();
        const previousTokenAmount = tokenAmounts.get(tokenKey);

        tokenAmounts.set(tokenKey, {
            amount: previousTokenAmount
                ? previousTokenAmount.amount.plus(claimableAmount)
                : claimableAmount,
            decimals: reward.token.decimals,
            symbol: reward.token.symbol,
        });
    }

    return [...tokenAmounts.values()].map(({ amount, decimals, symbol }) => ({
        amount: subunitsToUnits({ value: asAmountSubunit(amount), decimals }).toString(),
        decimals,
        symbol: toTokenSymbol(symbol),
    }));
};

type RewardTokenAmount = ReturnType<typeof getRewardTokenAmounts>[number];

const COMPACT_REWARD_AMOUNT_OPTIONS = {
    maximumSignificantDigits: 4,
    minimumDisplayedValue: '0.0001',
} as const;

const RewardAmountsContainer = styled.span`
    display: block;
    width: 100%;
`;

const RewardAmountsText = styled.span`
    ${typography['body-xs']}
    display: block;
    max-width: 100%;
    color: ${({ theme }) => theme.contentSecondary};
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    white-space: pre-line;
`;

type RewardTokenAmountsProps = {
    rewardTokenAmounts: RewardTokenAmount[];
};

const RewardTokenAmounts = ({ rewardTokenAmounts }: RewardTokenAmountsProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const formatAmount = ({ amount, decimals, symbol }: RewardTokenAmount, isCompact: boolean) => {
        const compactAmount = isCompact
            ? getCompactAmount({ value: amount, ...COMPACT_REWARD_AMOUNT_OPTIONS })
            : null;
        const formattedAmount = CryptoAmountFormatter.format(compactAmount?.value ?? amount, {
            symbol,
            isBalance: true,
            maxDisplayedDecimals: decimals,
            isEllipsisAppended: false,
        });

        return compactAmount?.isLessThanMinimum ? `<${formattedAmount}` : formattedAmount;
    };

    const compactRewardAmounts = rewardTokenAmounts
        .map(rewardTokenAmount => formatAmount(rewardTokenAmount, true))
        .join('\n');
    const fullRewardAmounts = rewardTokenAmounts
        .map(rewardTokenAmount => formatAmount(rewardTokenAmount, false))
        .join('\n');

    return (
        <Tooltip
            as="span"
            display="inline-flex"
            width="100%"
            isActive={compactRewardAmounts !== fullRewardAmounts}
            content={fullRewardAmounts}
        >
            <RewardAmountsContainer>
                <RewardAmountsText data-testid="@earn/claim-select-account/reward-amounts">
                    {compactRewardAmounts}
                </RewardAmountsText>
            </RewardAmountsContainer>
        </Tooltip>
    );
};

type EarnYieldClaimSelectAccountModalProps = {
    accountsRewards: YieldAccountsRewards;
    onSelect: (account: YieldAccountsRewards[number]) => void;
    onClose: () => void;
};

export const EarnYieldClaimSelectAccountModal = ({
    accountsRewards,
    onSelect,
    onClose,
}: EarnYieldClaimSelectAccountModalProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const baseCurrency = useSelector(selectBaseCurrency);

    const sortedAccountsRewards = [...accountsRewards].sort((a, b) =>
        compareAccountsByCoin(a.account, b.account),
    );

    const handleOnSelect = (account: YieldAccountsRewards[number]) => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'claim-select-account-modal',
                to: 'claim-form',
                networkSymbol: account.account.symbol,
            },
        });

        onSelect(account);
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'claim-select-account-modal',
                to: 'claim-select-account-modal',
            },
        });

        onClose();
    };

    return (
        <Modal
            heading={<Translation id="TR_EARN_YIELD_CLAIM_MODAL_TITLE" />}
            description={<Translation id="TR_EARN_YIELD_CLAIM_MODAL_SUBTITLE" />}
            onCancel={handleOnCancel}
            data-testid="@modal/earn-claim-select-account"
        >
            <CardList>
                {sortedAccountsRewards.map(accountRewards => {
                    const rewardTokenAmounts = getRewardTokenAmounts(accountRewards);

                    return (
                        <CardList.Item
                            key={accountRewards.account.key}
                            onClick={() => handleOnSelect(accountRewards)}
                            data-testid={`@earn/claim-select-account/account/${accountRewards.account.symbol}-${accountRewards.account.accountType}-${accountRewards.account.index}`}
                        >
                            <Row gap={16} flex="1" overflow="hidden">
                                <TokenIcon symbol={accountRewards.account.symbol} size={32} />
                                <Column flex="1" overflow="hidden" gap={2} alignItems="flex-start">
                                    <AccountLabel
                                        account={accountRewards.account}
                                        showAccountTypeBadge
                                        accountTypeBadgeSize="small"
                                        typographyStyle="body-md-strong"
                                    />
                                    <RewardTokenAmounts rewardTokenAmounts={rewardTokenAmounts} />
                                </Column>
                            </Row>
                            <Row gap={8} alignItems="center" flex="none">
                                <Tooltip
                                    content={
                                        isDebugModeActive ? (
                                            <Column gap={8} alignItems="flex-start">
                                                <DebugOnlyBadge />
                                                <Text>
                                                    {accountRewards.totalClaimableFiatAmount.toFixed()}{' '}
                                                    {baseCurrency.toUpperCase()}
                                                </Text>
                                            </Column>
                                        ) : undefined
                                    }
                                >
                                    <HiddenPlaceholder>
                                        <Text
                                            typographyStyle="body-md-strong"
                                            isTabular
                                            data-testid="@earn/claim-select-account/fiat-amount"
                                        >
                                            {BaseCurrencyAmountFormatter.format(
                                                accountRewards.totalClaimableFiatAmount,
                                            )}
                                        </Text>
                                    </HiddenPlaceholder>
                                </Tooltip>
                                <Icon
                                    as={CaretRightIcon}
                                    size={16}
                                    intent="neutral"
                                    priority="secondary"
                                />
                            </Row>
                        </CardList.Item>
                    );
                })}
            </CardList>
        </Modal>
    );
};
