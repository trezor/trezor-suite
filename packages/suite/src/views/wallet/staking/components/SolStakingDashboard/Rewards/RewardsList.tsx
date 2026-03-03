import React, { useRef } from 'react';

import { Translation } from '@suite/intl';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { formatNetworkAmount, isTestnet } from '@suite-common/wallet-utils';
import {
    Card,
    Column,
    Grid,
    IconCircle,
    Row,
    SkeletonStack,
    Text,
    Tooltip,
} from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { BaseCurrencyValue, FormattedCryptoAmount, FormattedDate } from 'src/components/suite';
import { Pagination } from 'src/components/wallet';
import { TransactionTargetLayout } from 'src/components/wallet/TransactionItem/TransactionTargetLayout';
import { type SolanaRewards } from 'src/hooks/wallet/useSolanaRewards';
import { Account } from 'src/types/wallet';
import SkeletonTransactionItem from 'src/views/wallet/transactions/TransactionList/SkeletonTransactionItem';

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
                                <Text
                                    typographyStyle="body-sm-strong"
                                    intent="neutral"
                                    priority="secondary"
                                    data-testid={`${TEST_ID}/date`}
                                >
                                    <FormattedDate
                                        value={reward?.time}
                                        day="numeric"
                                        month="long"
                                        year="numeric"
                                    />
                                </Text>
                                <Card paddingType="none">
                                    <Row gap={32} padding={{ vertical: 16, horizontal: 24 }}>
                                        <IconCircle name="piggyBank" intent="neutral" size={40} />
                                        <Column flex="1" gap={4}>
                                            <Text typographyStyle="body-md">
                                                <Translation id="TR_REWARD" />
                                            </Text>
                                            <Grid
                                                columns="1fr max-content minmax(110px, max-content)"
                                                rowGap={6}
                                                columnGap={24}
                                                flex="1"
                                            >
                                                <TransactionTargetLayout
                                                    addressLabel={
                                                        <Tooltip
                                                            maxWidth={250}
                                                            content={
                                                                <Translation
                                                                    id="TR_STAKE_REWARDS_TOOLTIP"
                                                                    values={{
                                                                        count: SOLANA_EPOCH_DAYS,
                                                                    }}
                                                                />
                                                            }
                                                            hasIcon
                                                        >
                                                            <span data-testid={`${TEST_ID}/epoch`}>
                                                                <Translation
                                                                    id="TR_STAKE_REWARDS_BADGE"
                                                                    values={{ count: reward.epoch }}
                                                                />
                                                            </span>
                                                        </Tooltip>
                                                    }
                                                    amount={
                                                        reward?.amount && (
                                                            <FormattedCryptoAmount
                                                                value={formatNetworkAmount(
                                                                    reward?.amount,
                                                                    account.symbol,
                                                                )}
                                                                symbol={account.symbol}
                                                                data-testid={`${TEST_ID}/crypto-amount`}
                                                            />
                                                        )
                                                    }
                                                    fiatAmount={
                                                        reward?.amount && (
                                                            <BaseCurrencyValue
                                                                amount={formatNetworkAmount(
                                                                    reward?.amount,
                                                                    account.symbol,
                                                                )}
                                                                symbol={account.symbol}
                                                                data-testid={`${TEST_ID}/fiat-amount`}
                                                            />
                                                        )
                                                    }
                                                />
                                            </Grid>
                                        </Column>
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
