import { Meta, StoryObj } from '@storybook/react';
import { Badge as BadgeComponent, BadgeProps, allowedBadgeFrameProps, badgeSizes } from './Badge';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Badge',
    component: BadgeComponent,
} as Meta;
export default meta;

export const Badge: StoryObj<BadgeProps> = {
    args: {
        children: 'Badge label',
        size: 'tiny',
        ...getFramePropsStory(allowedBadgeFrameProps).args,
    },
    argTypes: {
        size: {
            control: {
                type: 'radio',
            },
            options: badgeSizes,
        },
        ...getFramePropsStory(allowedBadgeFrameProps).argTypes,
    },
};
