import React, { useRef } from 'react';

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
import { Translation } from 'src/components/suite/Translation';
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
            {rewards.isLoading || rewards.selectedAccountRewards === undefined ? (
                <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </SkeletonStack>
            ) : (
                <>
                    {rewards.slicedRewards?.map(reward => (
                        <React.Fragment key={reward.epoch}>
                            <Row>
                                <ColDate>
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
                                                    <Row gap={spacings.xxs} alignItems="center">
                                                        <Translation
                                                            id="TR_STAKE_REWARDS_BADGE"
                                                            values={{ count: reward.epoch }}
                                                        />
                                                        <Icon name="info" size={12} />
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
                                                    />
                                                </Text>
                                            </HiddenPlaceholder>
                                        </Column>
                                    )}
                                </Row>
                            </Card>
                        </React.Fragment>
                    ))}
                </>
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
        </DashboardSection>
    );
};
