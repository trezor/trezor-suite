import { type ReactNode } from 'react';

import { type TimelineDetailsCardItem } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';

import { type HowEarnWorksBenefitItem } from '../../components/HowEarnWorks/HowEarnWorksBenefitsSection';

export type HowEarnWorksTimelineSectionPreset = {
    id: string;
    title: ReactNode;
    iconName?: IconName;
    items: TimelineDetailsCardItem[];
};

export type HowEarnWorksScreenPreset = {
    benefitItems: HowEarnWorksBenefitItem[];
    timelineSections: HowEarnWorksTimelineSectionPreset[];
};
