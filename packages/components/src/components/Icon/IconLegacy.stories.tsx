import { Meta, StoryObj } from '@storybook/react';
import { IconLegacy as IconLegacyComponent, iconVariants, IconLegacyProps } from './IconLegacy';
import { variables } from '../../config';

const meta: Meta = {
    title: 'Icons',
    component: IconLegacyComponent,
} as Meta;
export default meta;

export const LegacyIcon: StoryObj<IconLegacyProps> = {
    args: {
        icon: 'TAG',
        variant: 'primary',
    },
    argTypes: {
        icon: {
            options: variables.ICONS,
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
            options: [undefined, '#9be887'],
            control: {
                type: 'select',
            },
        },
    },
};
