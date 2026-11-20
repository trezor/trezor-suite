import { ReferAFriendContentActive } from './ReferAFriendContentActive';
import { ReferAFriendContentInactive } from './ReferAFriendContentInactive';
import { useReferAFriend } from '../hooks/useReferAFriend';

export const ReferAFriendContent = () => {
    const referAFriend = useReferAFriend();

    if (!referAFriend) {
        // TODO: skeleton?
        return null;
    }

    const { program, referralLink, stats, vouchers } = referAFriend;

    if (referralLink) {
        return (
            <ReferAFriendContentActive
                program={program}
                referralLink={referralLink}
                stats={stats}
                vouchers={vouchers}
            />
        );
    }

    return <ReferAFriendContentInactive program={program} />;
};
