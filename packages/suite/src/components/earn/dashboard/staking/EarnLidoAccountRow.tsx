import { type MouseEvent } from 'react';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { selectStakingProductDescriptor } from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { calculateRewards } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, Column, Icon, Paragraph, Row, Table } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowDownIcon, ArrowRightIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnStakingCurrentRewards } from './EarnStakingCurrentRewards';
import { EarnStakingPotentialRewards } from './EarnStakingPotentialRewards';
import { EarnStakingRateTooltip } from './EarnStakingRateTooltip';
import { getEarnStakingPotentialRewards } from './getEarnStakingPotentialRewards';
import { getLidoEarnRowStatus } from './getLidoEarnRowStatus';
import { useLidoStaking } from '../../staking/lido/useLidoStaking';
import { useLidoWithdrawalRequests } from '../../staking/lido/useLidoWithdrawalRequests';
import { useNavigateToLidoRoute } from '../../staking/lido/useNavigateToLidoRoute';
import { EarnAccountCell } from '../common/EarnAccountCell';
import { EarnBuyButton } from '../common/EarnBuyButton';

const ETH_DECIMALS = 18;

type EarnLidoAccountRowProps = {
    account: Account;
    isCardLayout: boolean;
};

/** An account's Lido staking, with the same columns as the rows of the other staking products. */
export const EarnLidoAccountRow = ({ account, isCardLayout }: EarnLidoAccountRowProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { CryptoAmountFormatter } = useFormatters();
    const { isBelowMobile } = useLayoutSize();
    const navigateToLidoRoute = useNavigateToLidoRoute(account);
    const { productId, position, wstETHBalance, rate } = useLidoStaking(account);
    const {
        pendingRequests,
        claimableRequests,
        isUnknown: areWithdrawalsUnread,
        isError: hasWithdrawalsError,
        refetch: refetchWithdrawals,
    } = useLidoWithdrawalRequests(account);
    const limits = useSelector(
        state => selectStakingProductDescriptor(state, productId)?.limits ?? null,
    );

    const stakedBalance = new BigNumber(position?.balances.staked ?? 0)
        .shiftedBy(-ETH_DECIMALS)
        .toFixed();
    // Told by the wstETH held, so the stake stays reachable while its value cannot be read.
    const hasStake = new BigNumber(wstETHBalance).gt(0);
    const status = getLidoEarnRowStatus({
        hasStake,
        hasSpendableBalance: new BigNumber(account.availableBalance).gt(0),
        pendingRequestCount: pendingRequests.length,
        claimableRequestCount: claimableRequests.length,
        areWithdrawalsUnknown: areWithdrawalsUnread && hasWithdrawalsError,
    });

    // An account with nothing staked, nothing to stake and no withdrawal has no row, as in the
    // rest of the table.
    if (status === 'hidden') {
        return null;
    }

    const formatCryptoAmount = (amount: string) =>
        CryptoAmountFormatter.format(amount, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            formatStyle: 'compact-balance',
        });

    const currentRewards = calculateRewards(stakedBalance, rate);
    const potentialRewards = getEarnStakingPotentialRewards({
        currentRewards,
        availableBalance: account.availableBalance,
        limits,
        rate,
        networkSymbol: account.symbol,
    });

    const navigateToStake = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        navigateToLidoRoute('earn-lido-stake');
    };

    const navigateToClaim = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        navigateToLidoRoute('earn-lido-claim');
    };

    const retryWithdrawals = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        refetchWithdrawals();
    };

    const navigateToTradingBuy = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account),
            ),
        );
        dispatch(gotoThunk({ routeName: 'wallet-trading-buy' }));
    };

    const rowTestId = `@earn/dashboard/lido-row/${account.symbol}/${account.index}`;

    const accountCell = (
        <EarnAccountCell
            account={account}
            subtitle={<Translation id="TR_EARN_LIDO_ROW_SUBTITLE" />}
        />
    );
    const rateTooltip = <EarnStakingRateTooltip rateKind="apr" rate={rate} />;
    const currentRewardsColumn = (
        <EarnStakingCurrentRewards
            symbol={account.symbol}
            rewards={currentRewards}
            apy={rate}
            isStakingActive={hasStake}
            formattedStakingBalance={formatCryptoAmount(stakedBalance)}
        />
    );
    const potentialRewardsColumn = (
        <EarnStakingPotentialRewards
            symbol={account.symbol}
            rewards={potentialRewards}
            apy={rate}
            isCardanoNetworkType={false}
            formattedAccountBalance={formatCryptoAmount(account.formattedBalance)}
        />
    );
    const stakeButton = (
        <Button
            intent="brand"
            size="small"
            onClick={navigateToStake}
            data-testid="@earn/dashboard/lido-stake-button"
        >
            <Translation
                id={
                    hasStake
                        ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                        : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
                }
            />
        </Button>
    );
    const claimButton = (
        <Button
            intent="brand"
            size="small"
            onClick={navigateToClaim}
            data-testid="@earn/dashboard/lido-claim-button"
        >
            <Translation id="TR_EARN_STAKING_DASHBOARD_CLAIM_FUNDS" />
        </Button>
    );
    const buyButton = (
        <EarnBuyButton onClick={navigateToTradingBuy} data-testid="@earn/dashboard/buy-button" />
    );
    const retryButton = (
        <Button
            intent="neutral"
            priority="secondary"
            size="small"
            onClick={retryWithdrawals}
            data-testid="@earn/dashboard/lido-retry-button"
        >
            <Translation id="TR_TRY_AGAIN" />
        </Button>
    );
    const actionButtonByStatus = {
        stake: stakeButton,
        unstaking: null,
        claim: claimButton,
        'fund-claim': buyButton,
        'withdrawals-unknown': retryButton,
    };
    const actionButton = actionButtonByStatus[status];

    // A row with nothing staked and nothing to stake says where its withdrawal stands instead of
    // showing rewards.
    const withdrawalNoteByStatus = {
        stake: null,
        unstaking: <Translation id="TR_EARN_LIDO_UNSTAKING_TITLE" />,
        claim: null,
        'fund-claim': (
            <Translation
                id="TR_EARN_LIDO_ROW_CLAIM_NEEDS_FEE"
                values={{ displaySymbol: <AssetSymbol networkSymbol={account.symbol} /> }}
            />
        ),
        'withdrawals-unknown': <Translation id="TR_EARN_LIDO_WITHDRAWALS_UNKNOWN" />,
    };
    const withdrawalNoteText = withdrawalNoteByStatus[status];
    const withdrawalNote =
        withdrawalNoteText === null ? null : (
            <Paragraph
                typographyStyle="body-sm"
                intent="neutral"
                priority="secondary"
                data-testid="@earn/dashboard/lido-withdrawal-note"
            >
                {withdrawalNoteText}
            </Paragraph>
        );

    if (isCardLayout) {
        return (
            <Card
                paddingType="small"
                onClick={() => navigateToLidoRoute('earn-lido')}
                data-testid={rowTestId}
            >
                <Column gap={12} width="100%">
                    <Row justifyContent="space-between" alignItems="flex-start">
                        {accountCell}
                        {rateTooltip}
                    </Row>

                    {withdrawalNote}

                    {withdrawalNote === null &&
                        (isBelowMobile ? (
                            <Column gap={4}>
                                {currentRewardsColumn}
                                {rate !== null && (
                                    <Icon
                                        as={ArrowDownIcon}
                                        intent="neutral"
                                        priority="secondary"
                                        size={20}
                                    />
                                )}
                                {potentialRewardsColumn}
                            </Column>
                        ) : (
                            <Row alignItems="center">
                                <Column flex="2">{currentRewardsColumn}</Column>
                                <Column flex="1">
                                    {rate !== null && (
                                        <Icon
                                            as={ArrowRightIcon}
                                            intent="neutral"
                                            priority="secondary"
                                            size={20}
                                        />
                                    )}
                                </Column>
                                <Column flex="2">{potentialRewardsColumn}</Column>
                            </Row>
                        ))}

                    <Row justifyContent="flex-end">{actionButton}</Row>
                </Column>
            </Card>
        );
    }

    return (
        <Table.Row onClick={() => navigateToLidoRoute('earn-lido')} data-testid={rowTestId}>
            <Table.Cell>{accountCell}</Table.Cell>
            <Table.Cell>{rateTooltip}</Table.Cell>
            {withdrawalNote === null ? (
                <>
                    <Table.Cell>
                        <Row width="100%" alignItems="center" justifyContent="space-between">
                            {currentRewardsColumn}
                            {rate !== null && (
                                <Icon
                                    as={ArrowRightIcon}
                                    intent="neutral"
                                    priority="secondary"
                                    size={20}
                                />
                            )}
                        </Row>
                    </Table.Cell>
                    <Table.Cell>{potentialRewardsColumn}</Table.Cell>
                </>
            ) : (
                <Table.Cell colSpan={2}>{withdrawalNote}</Table.Cell>
            )}
            <Table.Cell align="end">{actionButton}</Table.Cell>
        </Table.Row>
    );
};
