import { useMemo } from 'react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';

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
                <Translation
                    id="TR_STAKING_BANNER_DETAIL_TITLE"
                    values={{ apy: formatApyValue(rate), displaySymbol }}
                />
            }
            description={
                rewards.gt(0) ? (
                    <Translation
                        id="TR_STAKING_BANNER_DETAIL_TEXT"
                        values={{
                            potentialRewards: (
                                <HiddenPlaceholder>{potentialRewards}</HiddenPlaceholder>
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
