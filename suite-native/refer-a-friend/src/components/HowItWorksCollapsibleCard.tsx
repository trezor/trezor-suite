import { type ReferralProgramData } from '@suite-common/refer-a-friend';
import { CollapsibleCard, IconList, IconListTitledItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type HowItWorksCollapsibleCardProps = {
    programData: ReferralProgramData;
    isProgramActive?: boolean;
};

export const HowItWorksCollapsibleCard = ({
    programData,
    isProgramActive,
}: HowItWorksCollapsibleCardProps) => (
    <CollapsibleCard
        title={<Translation id="referAFriend.howItWorks.title" />}
        isCollapsed={isProgramActive}
    >
        <IconList iconSize={36} verticalAlign="flex-start">
            <IconListTitledItem
                icon={1}
                title={<Translation id="referAFriend.howItWorks.getLink.title" />}
            >
                <Translation id="referAFriend.howItWorks.getLink.description" />
            </IconListTitledItem>
            <IconListTitledItem
                icon={2}
                title={<Translation id="referAFriend.howItWorks.inviteFriends.title" />}
            >
                <Translation id="referAFriend.howItWorks.inviteFriends.description" />
            </IconListTitledItem>
            <IconListTitledItem
                icon={3}
                title={<Translation id="referAFriend.howItWorks.spendOnEshop.title" />}
            >
                <Translation
                    id="referAFriend.howItWorks.spendOnEshop.description"
                    values={programData}
                />
            </IconListTitledItem>
        </IconList>
    </CollapsibleCard>
);
