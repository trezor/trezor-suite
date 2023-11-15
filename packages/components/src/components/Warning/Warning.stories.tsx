import { Meta, StoryObj } from '@storybook/react';
import { Warning as WarningComponent, WarningProps } from '../../index';

export default {
    title: 'Misc/Warning',
    component: WarningComponent,
} as Meta;

export const Warning: StoryObj<WarningProps> = {
    args: {
        children: 'Insert text here.',
        withIcon: true,
    },
    argTypes: {
        className: {
            control: false,
        },
    },
};
