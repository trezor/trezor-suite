import { useAccoutsSelector } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectAPYByAccountKey,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';

type CardanoStakingInfoBannerProps = {
    accountKey: AccountKey;
};

export const CardanoStakingInfoBanner = ({ accountKey }: CardanoStakingInfoBannerProps) => {
    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));

    const isStakedWithFiveBinaries = useAccoutsSelector(state =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    const isStakedOutsideEverstake = useNativeStakingSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );

    if (!isStakedWithFiveBinaries && !isStakedOutsideEverstake) {
        return null;
    }

    const apyValue = apy ?? <Translation id="earn.notAvailableShort" />;
    const translationId = isStakedWithFiveBinaries
        ? 'earn.infoBanner.providerReducingRewards'
        : 'earn.infoBanner.updateToNewProvider';

    return (
        <InlineAlertBox
            variant="warning"
            title={<Translation id={translationId} values={{ apy: apyValue }} />}
        />
    );
};
