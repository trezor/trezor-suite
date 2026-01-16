import React, { useRef } from 'react';

import { Translation } from '@suite/intl';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { formatNetworkAmount, isTestnet } from '@suite-common/wallet-utils';
import { Badge, Card, Column, Icon, Row, SkeletonStack, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import {
    BaseCurrencyValue,
    FormattedCryptoAmount,
    FormattedDate,
    HiddenPlaceholder,
} from 'src/components/suite';
import { Pagination } from 'src/components/wallet';
import { type SolanaRewards } from 'src/hooks/wallet/useSolanaRewards';
import { Account } from 'src/types/wallet';
import SkeletonTransactionItem from 'src/views/wallet/transactions/TransactionList/SkeletonTransactionItem';
import { ColDate } from 'src/views/wallet/transactions/TransactionList/TransactionsGroup/CommonComponents';

import { RewardsEmpty } from './RewardsEmpty';

interface RewardsListProps {
    account: Account;
    rewards: SolanaRewards;
}

const TEST_ID = '@staking/rewards-item';

export const RewardsList = ({ account, rewards }: RewardsListProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isSolanaMainnet = !isTestnet(account.symbol);

    const onPageSelected = (page: number) => {
        rewards.setSelectedPage(page);
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView();
        }
    };

    const noRewards = !isSolanaMainnet || rewards.selectedAccountRewards?.length === 0;
    if (noRewards && !rewards.isLoading) {
        return <RewardsEmpty />;
    }

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_REWARDS" />}
            data-testid="@wallet/accounts/rewards-list"
        >
            <Column gap={32}>
                {rewards.isLoading || rewards.selectedAccountRewards === undefined ? (
                    <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                        <SkeletonTransactionItem />
                    </SkeletonStack>
                ) : (
                    <Column gap={40}>
                        {rewards.slicedRewards?.map(reward => (
                            <Column gap={10} key={reward.epoch} data-testid={TEST_ID}>
                                <Row>
                                    <ColDate data-testid={`${TEST_ID}/date`}>
                                        <FormattedDate
                                            value={reward?.time ?? undefined}
                                            day="numeric"
                                            month="long"
                                            year="numeric"
                                        />
                                    </ColDate>
                                </Row>
                                <Card>
                                    <Row
                                        justifyContent="space-between"
                                        margin={{ horizontal: spacings.xs, bottom: spacings.xs }}
                                    >
                                        <Row gap={spacings.xs}>
                                            <Icon name="arrowLineDown" variant="tertiary" />
                                            <Column>
                                                <Text typographyStyle="body" variant="tertiary">
                                                    <Translation id="TR_REWARD" />
                                                </Text>
                                                <Tooltip
                                                    maxWidth={250}
                                                    content={
                                                        <Translation
                                                            id="TR_STAKE_REWARDS_TOOLTIP"
                                                            values={{ count: SOLANA_EPOCH_DAYS }}
                                                        />
                                                    }
                                                >
                                                    <Badge size="small">
                                                        <Row
                                                            gap={spacings.xxs}
                                                            alignItems="center"
                                                            data-testid={`${TEST_ID}/epoch`}
                                                        >
                                                            <Translation
                                                                id="TR_STAKE_REWARDS_BADGE"
                                                                values={{ count: reward.epoch }}
                                                            />
                                                            <Icon name="info" size="small" />
                                                        </Row>
                                                    </Badge>
                                                </Tooltip>
                                            </Column>
                                        </Row>
                                        {reward?.amount && (
                                            <Column alignItems="end">
                                                <HiddenPlaceholder>
                                                    <FormattedCryptoAmount
                                                        value={formatNetworkAmount(
                                                            reward?.amount,
                                                            account.symbol,
                                                        )}
                                                        symbol={account.symbol}
                                                        data-testid={`${TEST_ID}/crypto-amount`}
                                                    />
                                                </HiddenPlaceholder>
                                                <HiddenPlaceholder>
                                                    <Text typographyStyle="hint" variant="tertiary">
                                                        <BaseCurrencyValue
                                                            amount={formatNetworkAmount(
                                                                reward?.amount,
                                                                account.symbol,
                                                            )}
                                                            symbol={account.symbol}
                                                            data-testid={`${TEST_ID}/fiat-amount`}
                                                        />
                                                    </Text>
                                                </HiddenPlaceholder>
                                            </Column>
                                        )}
                                    </Row>
                                </Card>
                            </Column>
                        ))}
                    </Column>
                )}

                {rewards.showPagination && !rewards.isLoading && rewards.slicedRewards?.length && (
                    <Pagination
                        hasPages={true}
                        currentPage={rewards.currentPage}
                        isLastPage={rewards.isLastPage}
                        perPage={rewards.itemsPerPage}
                        totalItems={rewards.totalItems}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
