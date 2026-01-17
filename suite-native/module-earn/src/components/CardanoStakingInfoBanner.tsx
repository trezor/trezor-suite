import { useSelector } from 'react-redux';

import { AccountsRootState } from '@suite-common/wallet-core';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NativeStakingRootState, selectAPYByAccountKey } from '@suite-native/staking';
import {
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
} from '@suite-native/staking/src/cardanoStakingSelectors';

type CardanoStakingInfoBannerProps = {
    accountKey: string;
};

export const CardanoStakingInfoBanner = ({ accountKey }: CardanoStakingInfoBannerProps) => {
    const apy = useSelector((state: NativeStakingRootState) =>
        selectAPYByAccountKey(state, accountKey),
    );

    const isStakedWithFiveBinaries = useSelector((state: AccountsRootState) =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    const isStakedOutsideEverstake = useSelector((state: NativeStakingRootState) =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );

    if (!isStakedWithFiveBinaries && !isStakedOutsideEverstake) {
        return null;
    }

    const apyValue = apy ?? <Translation id="staking.notAvailableShort" />;
    const translationId = isStakedWithFiveBinaries
        ? 'staking.infoBanner.providerReducingRewards'
        : 'staking.infoBanner.updateToNewProvider';

    return (
        <InlineAlertBox
            variant="warning"
            title={<Translation id={translationId} values={{ apy: apyValue }} />}
        />
    );
};
