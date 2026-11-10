import { useMemo } from 'react';

import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol, getNetworkType } from '@suite-common/wallet-config';
import { getPotentialStakingRewards } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useStakingRate } from '#src/hooks/earn/useStakingRate';

import { type StakingBannerAccounts } from './useStakingBanner';

type StakingBannerViewProps = {
    accounts: StakingBannerAccounts;
    onExplore: () => void;
    onClose: () => void;
};

export const StakingBannerView = ({ accounts, onExplore, onClose }: StakingBannerViewProps) => {
    const [account] = accounts;
    const { CryptoAmountFormatter } = useFormatters();
    const formatApyValue = useFormatApy();
    const { rate } = useStakingRate({ symbol: account.symbol, accountKey: account.key });

    const displaySymbol = getDisplaySymbol(account.symbol);
    // Tron pays its rate as an APR, as its Earn modal says.
    const isAprRate = getNetworkType(account.symbol) === 'tron';
    const formattedRate = formatApyValue(rate);

    const rewards = useMemo(() => getPotentialStakingRewards(accounts, rate), [accounts, rate]);
    const potentialRewards = CryptoAmountFormatter.format(rewards.toFixed(), {
        symbol: account.symbol,
        isBalance: true,
        withSymbol: false,
        isEllipsisAppended: false,
        maxDisplayedDecimals: 8,
    });

    return (
        <Banner
            icon={PiggyBankIcon}
            intent="brand"
            title={
                isAprRate ? (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TITLE_APR"
                        values={{ apr: formattedRate, displaySymbol }}
                    />
                ) : (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TITLE"
                        values={{ apy: formattedRate, displaySymbol }}
                    />
                )
            }
            description={
                rewards.gt(0) ? (
                    <Translation
                        id={
                            isAprRate
                                ? 'TR_STAKING_BANNER_DETAIL_TEXT_APR'
                                : 'TR_STAKING_BANNER_DETAIL_TEXT'
                        }
                        values={{
                            potentialRewards: (
                                <HiddenPlaceholder>
                                    <RedactNumericalValue value={potentialRewards} />
                                </HiddenPlaceholder>
                            ),
                            displaySymbol,
                        }}
                    />
                ) : (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TEXT_EMPTY"
                        values={{ displaySymbol }}
                    />
                )
            }
            rightContent={
                <>
                    <Banner.Button onClick={onExplore}>
                        <Translation id="TR_STAKING_BANNER_DETAIL_EXPLORE_STAKING" />
                    </Banner.Button>
                    <Banner.IconButton
                        priority="secondary"
                        icon={XIcon}
                        onClick={onClose}
                        tooltip={{ content: <Translation id="TR_DISMISS" /> }}
                    />
                </>
            }
        />
    );
};
