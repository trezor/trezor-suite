import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useSelector } from '#src/hooks/suite/useSelector';

export const CardanoOutdatedStakingBanner = () => {
    const { dispatch } = useServices(injectDispatch);
    const formatApyValue = useFormatApy();
    const { rate: apy } = useNetworkStakingRate({ networkSymbol: asNetworkSymbol('ada') });

    const isNewProviderBannerEnabled = useSelector(state =>
        selectIsFeatureEnabled(state, Feature.banners.staking.ada.newProvider, true),
    );

    if (!isNewProviderBannerEnabled) {
        return null;
    }

    return (
        <Banner
            icon
            intent="warning"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(gotoThunk({ routeName: 'suite-earn' }))}
                    data-testid="@staking/cardano-outdated-banner/update-provider-button"
                >
                    <Translation id="TR_STAKING_MODAL_OUTDATED_BUTTON" />
                </Banner.Button>
            }
            description={
                <span data-testid="@staking/cardano-outdated-banner/paragraph">
                    <Translation
                        id="TR_STAKING_MODAL_OUTDATED"
                        values={{ apy: formatApyValue(apy) }}
                    />
                </span>
            }
        />
    );
};
