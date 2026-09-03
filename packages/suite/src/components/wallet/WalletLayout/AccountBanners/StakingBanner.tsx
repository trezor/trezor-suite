import { useMemo } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { gotoThunk, selectRouter } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { useDispatch } from '@suite-common/redux-utils';
import {
    calculateRewards,
    getNetworkAdjustedStakingBalance,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
    isSupportedStakingNetworkSymbol,
} from '@suite-common/staking';
import { type NetworkType, getDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useSelector } from 'src/hooks/suite';

import { EarnEthBanner } from './EarnEthBanner';
import { useEarnEthBanner } from './hooks/useEarnEthBanner';

type StakingBannerProps = {
    account: Account;
};

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const {
        stakeEthBannerClosed,
        stakeSolBannerClosed,
        stakeCardanoBannerClosed,
        stakeTronBannerClosed,
    } = useSelector(selectFlags);
    const { route } = useSelector(selectRouter);
    const { rate } = useStakingRate({ symbol: account.symbol, accountKey: account.key });
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));
    const earnEthBanner = useEarnEthBanner(account);

    const displaySymbol = getDisplaySymbol(account.symbol);
    const stakingData = getStakingDataForNetwork(account);

    const accountBalance = account.formattedBalance;
    const stakingBalance = stakingData?.depositedBalance ?? '0';

    const potentialRewards = useMemo(() => {
        const totalBalance = new BigNumber(stakingBalance || '0').plus(accountBalance).toString();
        const amount = calculateRewards(
            getNetworkAdjustedStakingBalance(totalBalance, account),
            rate,
        );

        return CryptoAmountFormatter.format(amount, {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [accountBalance, stakingBalance, rate, account, CryptoAmountFormatter]);

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
            case 'tron':
                dispatch(setFlag({ key: 'stakeTronBannerClosed', value: true }));
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
        dispatch(gotoThunk({ routeName: 'wallet-staking', preserveParams: true }));

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
            case 'tron':
                return stakeTronBannerClosed;
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

    if (route?.name !== 'wallet-index' || !account || earnEthBanner.isResolving) {
        return null;
    }

    // The earn promo has its own dismissal flag and is shown even to users who
    // already stake or closed the staking banner before the promo existed.
    if (earnEthBanner.hasYieldOption) {
        return <EarnEthBanner networkSymbol={account.symbol} apy={earnEthBanner.apy} />;
    }

    if (isStakingBannerClosed(account.networkType) || isStakingActive || !stakingLimits) {
        return null;
    }

    const hasEnoughBalanceForStaking = new BigNumber(accountBalance).gte(
        stakingLimits.MIN_AMOUNT_FOR_STAKING,
    );
    const hasPotentialRewards = new BigNumber(potentialRewards).gt(0);

    return (
        <Banner
            icon={PiggyBankIcon}
            intent="brand"
            title={
                <Translation
                    id="TR_STAKING_BANNER_DETAIL_TITLE"
                    values={{ apy: formatApyValue(rate), displaySymbol }}
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
                        priority="secondary"
                        icon={XIcon}
                        onClick={closeBanner}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
        />
    );
};
