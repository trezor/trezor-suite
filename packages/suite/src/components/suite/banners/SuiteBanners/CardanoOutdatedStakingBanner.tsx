import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import { selectPoolStatsApy } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const CardanoOutdatedStakingBanner = () => {
    const dispatch = useDispatch();
    const apy = useSelector(state => selectPoolStatsApy(state, { networkSymbol: 'ada' }));

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
                    onClick={() => dispatch(goto({ routeName: 'suite-earn' }))}
                    data-testid="@notification/bridge-deprecated/button"
                >
                    <Translation id="TR_STAKING_MODAL_OUTDATED_BUTTON" />
                </Banner.Button>
            }
            description={
                <Translation id="TR_STAKING_MODAL_OUTDATED" values={{ apy: formatApyValue(apy) }} />
            }
        />
    );
};
