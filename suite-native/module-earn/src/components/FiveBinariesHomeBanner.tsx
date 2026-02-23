import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { AccountsRootState } from '@suite-common/wallet-core';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { selectFirstCardanoAccountStakedWithFiveBinaries } from '@suite-native/staking/src/cardanoStakingSelectors';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

export const FiveBinariesHomeBanner = () => {
    const openLink = useOpenLink();

    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectFirstCardanoAccountStakedWithFiveBinaries(state),
    );

    if (!account) return null;

    const handleButtonPress = () => {
        openLink(`${HELP_CENTER_ADA_STAKING}#migrating-staking-pools`);
    };

    return (
        <InlineAlertBox
            variant="warning"
            title={<Translation id="earn.infoBanner.rewardsReduced" />}
            buttonLabel={<Translation id="generic.buttons.learnMore" />}
            onButtonPress={handleButtonPress}
        />
    );
};
