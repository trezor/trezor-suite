import { useSelector } from 'react-redux';

import {
    selectReferralLink,
    selectReferralProgramData,
    selectReferralRewards,
} from '@suite-common/refer-a-friend';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import {
    ReferAFriendContentActive,
    ReferAFriendContentInactive,
    useReferAFriend,
    useReferAFriendAutoRefresh,
} from '@suite-native/refer-a-friend';

export const ReferAFriendScreen = () => {
    const { isReferAFriendFeatureAvailable } = useReferAFriend();
    useReferAFriendAutoRefresh({ isEnabled: isReferAFriendFeatureAvailable });

    const programData = useSelector(selectReferralProgramData);
    const referralLink = useSelector(selectReferralLink);
    const referralRewards = useSelector(selectReferralRewards);

    if (!isReferAFriendFeatureAvailable || !programData || !referralRewards) {
        return null;
    }

    return (
        <Screen header={<ScreenHeader title={<Translation id="referAFriend.title" />} />}>
            {referralLink ? (
                <ReferAFriendContentActive
                    programData={programData}
                    referralLink={referralLink}
                    referralRewards={referralRewards}
                />
            ) : (
                <ReferAFriendContentInactive programData={programData} />
            )}
        </Screen>
    );
};
