import { Meta, StoryObj } from '@storybook/react';

import { Badge as BadgeComponent, BadgeProps, allowedBadgeFrameProps, badgeSizes } from './Badge';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof BadgeComponent> = {
    title: 'Badge',
    component: BadgeComponent,
};
export default meta;

export const Badge: StoryObj<typeof meta> = {
    args: {
        children: 'Badge label',
        isDisabled: false,
        variant: 'primary',
        size: 'tiny',
        ...getFramePropsStory(allowedBadgeFrameProps).args,
    },
    argTypes: {
        isDisabled: { control: 'boolean' },
        variant: {
            control: {
                type: 'radio',
            },
            options: [
                'primary',
                'tertiary',
                'destructive',
                'warning',
                'info',
                undefined,
            ] satisfies BadgeProps['variant'][],
        },
        size: {
            control: {
                type: 'radio',
            },
            options: badgeSizes,
        },
        ...getFramePropsStory(allowedBadgeFrameProps).argTypes,
    },
};
