import React, { useRef } from 'react';

import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    Badge,
    Card,
    Column,
    Icon,
    IconButton,
    Row,
    SkeletonStack,
    Text,
    Tooltip,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import {
    CoinBalance,
    FiatValue,
    FormattedDate,
    HiddenPlaceholder,
    Translation,
} from 'src/components/suite';
import { Pagination } from 'src/components/wallet';
import { useSolanaRewards } from 'src/hooks/wallet/useSolanaRewards';
import { Account } from 'src/types/wallet';
import SkeletonTransactionItem from 'src/views/wallet/transactions/TransactionList/SkeletonTransactionItem';
import { ColDate } from 'src/views/wallet/transactions/TransactionList/TransactionsGroup/CommonComponents';

import { RewardsEmpty } from './RewardsEmpty';

interface RewardsListProps {
    account: Account;
}

export const RewardsList = ({ account }: RewardsListProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);

    const {
        slicedRewards,
        isLoading,
        currentPage,
        setSelectedPage,
        totalItems,
        itemsPerPage,
        showPagination,
        isLastPage,
        fetchRewards,
    } = useSolanaRewards(account);

    const isSolanaMainnet = account.symbol === 'sol';

    const onPageSelected = (page: number) => {
        setSelectedPage(page);
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView();
        }
    };

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_REWARDS" />}
            data-testid="@wallet/accounts/rewards-list"
        >
            {isLoading ? (
                <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </SkeletonStack>
            ) : (
                <>
                    {slicedRewards?.map(reward => (
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
                                                            id="TR_STAKE_REWARDS_BAGE"
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
                                                <CoinBalance
                                                    value={formatNetworkAmount(
                                                        reward?.amount,
                                                        account.symbol,
                                                    )}
                                                    symbol={account.symbol}
                                                />
                                            </HiddenPlaceholder>
                                            <HiddenPlaceholder>
                                                <Text typographyStyle="hint" variant="tertiary">
                                                    <FiatValue
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

            {showPagination && (
                <Pagination
                    hasPages={true}
                    currentPage={currentPage}
                    isLastPage={isLastPage}
                    perPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageSelected={onPageSelected}
                />
            )}
        </DashboardSection>
    );
};
