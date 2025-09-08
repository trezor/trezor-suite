import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { NetworkType, getDisplaySymbol } from '@suite-common/wallet-config';
import {
    MIN_ETH_AMOUNT_FOR_STAKING,
    MIN_SOL_AMOUNT_FOR_STAKING,
} from '@suite-common/wallet-constants';
import { selectAccountIsStakingActive, selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import {
    Button,
    Card,
    Column,
    Grid,
    H4,
    IconButton,
    IconCircle,
    Paragraph,
    Row,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

interface StakingBannerProps {
    account: Account;
}

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const { isBelowLaptop } = useLayoutSize();
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const { stakeEthBannerClosed, stakeSolBannerClosed } = useSelector(selectSuiteFlags);
    const { route } = useSelector(state => state.router);
    const apy = useSelector(state => selectPoolStatsApyData(state, account.symbol));
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);

    const displaySymbol = getDisplaySymbol(account.symbol);
    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account.formattedBalance;
    const stakingBalance = stakingData?.depositedBalance ?? '0';

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance).plus(accountBalance).toString();
        const amount = new BigNumber(totalBalance).multipliedBy(apy / 100);

        return CryptoAmountFormatter.format(amount.toString(), {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            maxDisplayedDecimals: 8,
            isEllipsisAppended: false,
        });
    }, [accountBalance, stakingBalance, apy, account, CryptoAmountFormatter]);

    const closeBanner = () => {
        switch (account.networkType) {
            case 'ethereum':
                dispatch(setFlag('stakeEthBannerClosed', true));
                break;
            case 'solana':
                dispatch(setFlag('stakeSolBannerClosed', true));
                break;
        }

        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'cancel',
                from: 'account/banner',
                networkSymbol: account.symbol,
            },
        });
    };

    const goToStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));

        analytics.report({
            type: EventType.StakingNavigate,
            payload: {
                action: 'navigate',
                from: 'account/banner',
                networkSymbol: account.symbol,
            },
        });
    };

    const getNetworkDetails = (networkType: NetworkType) => {
        switch (networkType) {
            case 'ethereum':
                return {
                    isStakingBannerClosed: stakeEthBannerClosed,
                    minStakingAmount: MIN_ETH_AMOUNT_FOR_STAKING,
                };
            case 'solana':
                return {
                    isStakingBannerClosed: stakeSolBannerClosed,
                    minStakingAmount: MIN_SOL_AMOUNT_FOR_STAKING,
                };
            default:
                return {
                    isStakingBannerClosed: true,
                    minStakingAmount: undefined,
                };
        }
    };

    const { isStakingBannerClosed } = getNetworkDetails(account.networkType) ?? {};

    if (
        route?.name !== 'wallet-index' ||
        isStakingBannerClosed ||
        !account ||
        isStakingActive ||
        !stakingLimits
    ) {
        return null;
    }

    const hasEnoughBalanceForStaking = new BigNumber(accountBalance).gte(
        stakingLimits.MIN_AMOUNT_FOR_STAKING,
    );

    return (
        <Card>
            <Grid columns={isBelowLaptop ? '1fr' : '1fr auto'} gap={spacings.lg}>
                <Row gap={spacings.md}>
                    <Column>
                        <IconCircle name="piggyBank" variant="primary" size={50} />
                    </Column>
                    <Column gap={spacings.xxxs}>
                        <H4>
                            <Translation
                                id="TR_STAKING_BANNER_DETAIL_TITLE"
                                values={{ apy, displaySymbol }}
                            />
                        </H4>

                        <Paragraph variant="tertiary" typographyStyle="hint">
                            {!hasEnoughBalanceForStaking ? (
                                <Translation
                                    id="TR_STAKING_BANNER_DETAIL_TEXT_EMPTY"
                                    values={{ displaySymbol }}
                                />
                            ) : (
                                <Translation
                                    id="TR_STAKING_BANNER_DETAIL_TEXT"
                                    values={{ potentialRewards, displaySymbol }}
                                />
                            )}
                        </Paragraph>
                    </Column>
                </Row>

                <Row gap={spacings.sm}>
                    <Button size="small" onClick={goToStakingTab}>
                        <Translation id="TR_STAKING_BANNER_DETAIL_EXPLORE_STAKING" />
                    </Button>
                    <IconButton size="small" variant="tertiary" icon="x" onClick={closeBanner} />
                </Row>
            </Grid>
        </Card>
    );
};
