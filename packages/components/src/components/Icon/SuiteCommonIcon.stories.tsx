import { Meta, StoryObj } from '@storybook/react';
import { Icon as IconComponent, WebIconProps } from '@suite-common/icons/src/webComponents';
import { IconName, icons } from '@suite-common/icons/src/icons';
import { colorVariants } from '@trezor/theme';
const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

const iconNames = Object.keys(icons) as IconName[];
const colors = Object.keys(colorVariants.standard);

export const Icon: StoryObj<WebIconProps> = {
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
