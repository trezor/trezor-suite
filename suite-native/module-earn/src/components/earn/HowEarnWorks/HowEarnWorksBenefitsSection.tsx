import { type ReactNode } from 'react';

import { IconList, IconListTitledItem } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';

export type HowEarnWorksBenefitItem = {
    id: string;
    icon: IconName;
    title: ReactNode;
    description: ReactNode;
};

type HowEarnWorksBenefitsSectionProps = {
    items: HowEarnWorksBenefitItem[];
};

export const HowEarnWorksBenefitsSection = ({ items }: HowEarnWorksBenefitsSectionProps) => (
    <IconList iconIntent="brand" verticalAlign="flex-start">
        {items.map(item => (
            <IconListTitledItem key={item.id} icon={item.icon} title={item.title}>
                {item.description}
            </IconListTitledItem>
        ))}
    </IconList>
);
