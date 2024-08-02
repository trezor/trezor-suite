import { Meta, StoryObj } from '@storybook/react';
import { Badge as BadgeComponent, BadgeProps, allowedBadgeFrameProps } from './Badge';
import { getFramePropsStory } from '../common/frameProps';

const meta: Meta = {
    title: 'Misc/Badge',
    component: BadgeComponent,
} as Meta;
export default meta;

export const Badge: StoryObj<BadgeProps> = {
    args: {
        children: 'Badge label',
        ...getFramePropsStory(allowedBadgeFrameProps).args,
    },
    argTypes: getFramePropsStory(allowedBadgeFrameProps).argTypes,
};
