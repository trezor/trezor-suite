import { useMemo } from 'react';

import { events } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { type NetworkType, getDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive, selectPoolStatsApyData } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
    isSupportedStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { formatApyValue } from 'src/views/wallet/staking/utils/formatStakeValues';

type StakingBannerProps = {
    account: Account;
};

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const { stakeEthBannerClosed, stakeSolBannerClosed, stakeCardanoBannerClosed } =
        useSelector(selectFlags);
    const { route } = useSelector(state => state.router);
    const apy = useSelector(state => selectPoolStatsApyData(state, account));
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const displaySymbol = getDisplaySymbol(account.symbol);
    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account.formattedBalance;
    const stakingBalance = stakingData?.depositedBalance ?? '0';

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance || '0').plus(accountBalance).toString();
        const amount = calculateRewards(
            getNetworkAdjustedStakingBalance(totalBalance, account),
            apy,
        );

        return CryptoAmountFormatter.format(amount, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [accountBalance, stakingBalance, apy, account, CryptoAmountFormatter]);

    const closeBanner = () => {
        switch (account.networkType) {
            case 'ethereum':
                dispatch(setFlag({ key: 'stakeEthBannerClosed', value: true }));
                break;
            case 'solana':
                dispatch(setFlag({ key: 'stakeSolBannerClosed', value: true }));
                break;
            case 'cardano':
                dispatch(setFlag({ key: 'stakeCardanoBannerClosed', value: true }));
                break;
            default:
                if (isSupportedStakingNetworkSymbol(account.symbol)) {
                    exhaustive(
                        account.networkType as never,
                        `Add missing case for ${account.symbol} network type`,
                    );
                }
        }

        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'account/banner',
                networkSymbol: account.symbol,
            },
        });
    };

    const goToStakingTab = () => {
        dispatch(goto({ routeName: 'wallet-staking', preserveParams: true }));

        analytics.report({
            type: events.stakingNavigateEvent.name,
            payload: {
                action: 'navigate',
                from: 'account/banner',
                networkSymbol: account.symbol,
            },
        });
    };

    const isStakingBannerClosed = (networkType: NetworkType) => {
        switch (networkType) {
            case 'ethereum':
                return stakeEthBannerClosed;
            case 'solana':
                return stakeSolBannerClosed;
            case 'cardano':
                return stakeCardanoBannerClosed;
            default:
                if (isSupportedStakingNetworkSymbol(account.symbol)) {
                    exhaustive(
                        account.networkType as never,
                        `Add missing case for ${account.symbol} network type`,
                    );
                }

                return true;
        }
    };

    const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);

    if (
        route?.name !== 'wallet-index' ||
        isStakingBannerClosed(account.networkType) ||
        !account ||
        isStakingActive ||
        !stakingLimits
    ) {
        return null;
    }

    const hasEnoughBalanceForStaking = new BigNumber(accountBalance).gte(
        stakingLimits.MIN_AMOUNT_FOR_STAKING,
    );
    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    return (
        <Banner
            icon="piggyBank"
            intent="brand"
            title={
                <Translation
                    id="TR_STAKING_BANNER_DETAIL_TITLE"
                    values={{ apy: formatApyValue(apy), displaySymbol }}
                />
            }
            description={
                !hasEnoughBalanceForStaking || !hasPotentialRewards ? (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TEXT_EMPTY"
                        values={{ displaySymbol }}
                    />
                ) : (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TEXT"
                        values={{ potentialRewards, displaySymbol }}
                    />
                )
            }
            rightContent={
                <>
                    <Banner.Button onClick={goToStakingTab}>
                        <Translation id="TR_STAKING_BANNER_DETAIL_EXPLORE_STAKING" />
                    </Banner.Button>
                    <Banner.IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        onClick={closeBanner}
                    />
                </>
            }
        />
    );
};
