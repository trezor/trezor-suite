import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useFormatApy } from 'src/hooks/earn/useFormatApy';
import { useStakingRate } from 'src/hooks/earn/useStakingRate';

import { getPotentialStakingRewards } from './getPotentialStakingRewards';
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

    const potentialRewards = useMemo(
        () =>
            CryptoAmountFormatter.format(getPotentialStakingRewards(accounts, rate).toFixed(), {
                symbol: account.symbol,
                isBalance: true,
                withSymbol: false,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            }),
        [accounts, rate, account.symbol, CryptoAmountFormatter],
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
                hasPotentialRewards ? (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TEXT"
                        values={{ potentialRewards, displaySymbol }}
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
