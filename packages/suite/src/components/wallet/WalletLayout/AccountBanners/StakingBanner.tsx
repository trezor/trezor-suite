import { useMemo } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { goto, selectRouter } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { useFormatters } from '@suite-common/formatters';
import { getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import {
    type NetworkType,
    getDisplaySymbol,
    getNetworkByYieldXyzId,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { selectAccountIsStakingActive } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    calculateRewards,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
    isSupportedStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Banner, Row } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { EarnStakingVsYieldHint } from 'src/components/earn/dashboard/common/EarnStakingVsYieldHint';
import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemYield } from 'src/hooks/suite/useMessageSystemYield';

type StakingBannerProps = {
    account: Account;
};

const emptyVaults: YieldDtoV2[] = [];

export const StakingBanner = ({ account }: StakingBannerProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const {
        stakeEthBannerClosed,
        earnEthBannerClosed,
        stakeSolBannerClosed,
        stakeCardanoBannerClosed,
        stakeTronBannerClosed,
    } = useSelector(selectFlags);
    const { route } = useSelector(selectRouter);
    const { rate } = useStakingRate({ symbol: account.symbol, accountKey: account.key });
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const yieldDepositMessageSystem = useMessageSystemYield('deposit');
    const isYieldOptionRelevant =
        account.networkType === 'ethereum' && !yieldDepositMessageSystem.isDisabled;
    const {
        data: availableVaults,
        isSuccess: hasLoadedVaults,
        isError: hasVaultsError,
    } = useAllYieldOpportunities({ enabled: isYieldOptionRelevant });

    const displaySymbol = getDisplaySymbol(account.symbol);
    const stakingData = getStakingDataForNetwork(account);

    // The native coin can also earn yield via a wrapped-native vault — promote both options.
    const hasYieldOption =
        isYieldOptionRelevant &&
        (availableVaults ?? emptyVaults).some(
            vault =>
                !vault.metadata.underMaintenance &&
                !vault.metadata.deprecated &&
                getNetworkByYieldXyzId(vault.network)?.symbol === account.symbol &&
                isWrappedNativeToken(account.symbol, vault.token.address),
        );
    // Hold rendering until the vaults query settles so the banner variant does not
    // flash from staking-only to staking+yield underneath the user.
    const isYieldOptionResolving = isYieldOptionRelevant && !hasLoadedVaults && !hasVaultsError;

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

    const closeEarnBanner = () => {
        dispatch(setFlag({ key: 'earnEthBannerClosed', value: true }));

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'account-banner',
                to: 'earn-dashboard',
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

    const goToEarnDashboard = () => {
        dispatch(goto({ routeName: 'suite-earn' }));

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'account-banner',
                to: 'earn-dashboard',
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

    if (route?.name !== 'wallet-index' || !account || isYieldOptionResolving) {
        return null;
    }

    // The earn promo has its own dismissal flag and is shown even to users who
    // already stake or closed the staking banner before the promo existed.
    if (hasYieldOption) {
        if (earnEthBannerClosed) {
            return null;
        }

        return (
            <Banner
                icon={PiggyBankIcon}
                isIconCentered
                intent="brand"
                title={
                    <Translation id="TR_STAKING_BANNER_ETH_EARN_TITLE" values={{ displaySymbol }} />
                }
                description={
                    <Row gap={8} alignItems="center" flexWrap="wrap">
                        <Translation
                            id="TR_STAKING_BANNER_ETH_EARN_TEXT"
                            values={{ displaySymbol }}
                        />
                        <EarnStakingVsYieldHint />
                    </Row>
                }
                rightContent={
                    <>
                        <Banner.Button onClick={goToEarnDashboard}>
                            <Translation id="TR_STAKING_BANNER_ETH_EARN_BUTTON" />
                        </Banner.Button>
                        <Banner.IconButton
                            intent="neutral"
                            priority="secondary"
                            icon={XIcon}
                            onClick={closeEarnBanner}
                            tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                        />
                    </>
                }
            />
        );
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
                        intent="neutral"
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
