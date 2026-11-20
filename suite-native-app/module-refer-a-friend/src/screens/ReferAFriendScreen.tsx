import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { ReferAFriendContent } from '@suite-native/refer-a-friend';

export const ReferAFriendScreen = () => (
    <Screen header={<ScreenHeader title={<Translation id="referAFriend.title" />} />}>
        <ReferAFriendContent />
    </Screen>
);
