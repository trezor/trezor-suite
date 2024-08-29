import { Meta, StoryObj } from '@storybook/react';
import { allowedIconFrameProps, Icon as IconComponent, IconProps, iconVariants } from './Icon';
import { IconName, icons } from '@suite-common/icons/src/icons';
import { getFramePropsStory } from '../../utils/frameProps';
import { iconSizes } from '@suite-common/icons';
const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

const iconNames = Object.keys(icons) as IconName[];

export const Icon: StoryObj<IconProps> = {
    args: {
        name: 'discover',
        variant: 'primary',
        size: 'large',
        color: undefined,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        name: {
            options: iconNames,
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
        size: {
            options: iconSizes,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
