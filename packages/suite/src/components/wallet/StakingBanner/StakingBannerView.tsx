import { HiddenPlaceholder, RedactNumericalValue } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import {
    formatStakingAmount,
    getPotentialStakingRewards,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { PiggyBankIcon, XIcon } from '@trezor/icons';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useSelector } from '#src/hooks/suite/useSelector';

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

    const { rate, rateKind } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const stakeableDescriptor = useSelector(state =>
        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol),
    );

    const displaySymbol = getDisplaySymbol(account.symbol);
    const isAprRate = rateKind === 'apr';
    const formattedRate = formatApyValue(rate);

    const rewards = getPotentialStakingRewards({
        accounts,
        limits: stakeableDescriptor?.limits ?? null,
        rate,
    });

    const hasPotentialRewards = isPositiveBalance(rewards);

    const potentialRewards = CryptoAmountFormatter.format(
        formatStakingAmount({ amount: rewards, networkSymbol: account.symbol }),
        {
            symbol: account.symbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        },
    );

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
                hasPotentialRewards ? (
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
