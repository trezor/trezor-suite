import { CollapsibleCard, IconList, IconListTitledItem } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import type { ProgramProps } from '../hooks/useReferAFriend';

type HowItWorksCollapsibleCardProps = {
    program: ProgramProps;
    isProgramActive?: boolean;
};

export const HowItWorksCollapsibleCard = ({
    program,
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
                    values={program}
                />
            </IconListTitledItem>
        </IconList>
    </CollapsibleCard>
);
