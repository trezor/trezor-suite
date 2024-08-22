import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, IconProps } from './Icon';
import { IconName, icons } from '@suite-common/icons/src/icons';
import { colorVariants } from '@trezor/theme';
const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

const iconNames = Object.keys(icons) as IconName[];
const colors = Object.keys(colorVariants.standard);

export const Icon: StoryObj<IconProps> = {
    args: {
        name: 'discover',
        color: 'iconDefault',
    },
    argTypes: {
        name: {
            options: iconNames,
            control: {
                type: 'select',
            },
        },
        color: {
            options: colors,
            control: {
                type: 'select',
            },
        },
    },
};
