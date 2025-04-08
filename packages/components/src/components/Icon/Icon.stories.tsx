import { Meta, StoryObj } from '@storybook/react';

import { icons } from '@suite-common/icons/src/icons';

import { Icon as IconComponent, allowedIconFrameProps, iconSizes, iconVariants } from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

export const Icon: StoryObj<typeof IconComponent> = {
    args: {
        name: 'discover',
        variant: 'primary',
        size: 'large',
        color: undefined,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        name: {
            options: Object.keys(icons),
            control: {
                type: 'select',
            },
        },
        variant: {
            options: iconVariants,
            control: {
                type: 'select',
            },
        },
        color: {
            control: 'color',
        },
        size: {
            options: Object.values(iconSizes),
            control: {
                type: 'select',
                labels: Object.fromEntries(
                    Object.entries(iconSizes).map(([key, value]) => [value, `${key}: ${value}`]),
                ),
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
