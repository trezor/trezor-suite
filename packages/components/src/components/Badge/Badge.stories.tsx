import { type Meta, type StoryObj } from '@storybook/react';

import { Badge as BadgeComponent, allowedBadgeFrameProps } from './Badge';
import { badgeIntents, badgeSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof BadgeComponent> = {
    title: 'Badge',
    component: BadgeComponent,
};
export default meta;

export const Badge: StoryObj<typeof meta> = {
    args: {
        children: 'Placeholder',
        intent: 'brand',
        size: 'small',
        ...getFramePropsStory(allowedBadgeFrameProps).args,
    },
    argTypes: {
        intent: {
            control: {
                type: 'select',
            },
            options: badgeIntents,
        },
        size: {
            control: {
                type: 'select',
            },
            options: badgeSizes,
        },
        ...getFramePropsStory(allowedBadgeFrameProps).argTypes,
    },
};
