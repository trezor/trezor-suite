import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type StakeRootState,
    selectAccountNetworkSymbol,
    selectIsCardanoStakedWithFiveBinaries,
    useAccountsSelector,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerFull, BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

type CardanoStakingInfoBannerProps = {
    accountKey: AccountKey;
};

export const CardanoStakingInfoBanner = ({ accountKey }: CardanoStakingInfoBannerProps) => {
    const openLink = useOpenLink();

    const networkSymbol = useAccountsSelector(state =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const isStakedWithFiveBinaries = useSelector((state: StakeRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    const handleLearnMorePress = () => {
        openLink(`${HELP_CENTER_ADA_STAKING}#migrating-staking-pools`);
    };

    if (isStakedWithFiveBinaries) {
        return (
            <BannerFull
                testID="@staking/cardano-not-earning-banner"
                intent="warning"
                title={
                    <Translation id="earn.stakingManagementScreen.cardanoNotEarningBanner.title" />
                }
                description={
                    <Translation id="earn.stakingManagementScreen.cardanoNotEarningBanner.description" />
                }
                primaryButtonLabel={
                    <Translation id="earn.stakingManagementScreen.cardanoNotEarningBanner.button" />
                }
                onPressPrimaryButton={handleLearnMorePress}
            />
        );
    }

    if (!networkSymbol) {
        return null;
    }

    return (
        <BannerInline
            testID="@staking/cardano-desktop-only-banner"
            intent="info"
            title={
                <Translation
                    id="earn.stakingManagementScreen.cardanoDesktopOnlyBanner"
                    values={{ symbol: getNetworkDisplaySymbol(networkSymbol) }}
                />
            }
        />
    );
};
