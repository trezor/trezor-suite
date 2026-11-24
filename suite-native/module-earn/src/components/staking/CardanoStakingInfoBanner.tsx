import { useSelector } from 'react-redux';

import { createAssetId } from '@suite-common/assets';
import { type StakingRootState, selectHasStakingAccountWarning } from '@suite-common/earn-staking';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AssetSymbol } from '@suite-native/assets';
import { BannerFull, BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { HELP_CENTER_ADA_STAKING_UPDATE_PROVIDER } from '@trezor/urls';

type CardanoStakingInfoBannerProps = {
    accountKey: AccountKey;
};

export const CardanoStakingInfoBanner = ({ accountKey }: CardanoStakingInfoBannerProps) => {
    const openLink = useOpenLink();

    const networkSymbol = useAccountsSelector(state =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const hasOutdatedProvider = useSelector((state: StakingRootState) =>
        selectHasStakingAccountWarning(state, accountKey, 'outdated-provider'),
    );

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_ADA_STAKING_UPDATE_PROVIDER);
    };

    if (hasOutdatedProvider) {
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
                    values={{
                        symbol: (
                            <AssetSymbol
                                assetId={createAssetId({ networkSymbol })}
                                variant="body-sm"
                                color="contentInfo"
                            />
                        ),
                    }}
                />
            }
        />
    );
};
