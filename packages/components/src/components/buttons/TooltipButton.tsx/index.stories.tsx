import React from 'react';
import { StoryObj } from '@storybook/react';
import { TooltipButton } from '.';

export default {
    title: 'Buttons/TooltipButton',
    component: TooltipButton,
};

export const Basic: StoryObj<typeof TooltipButton> = {
    render: args => <TooltipButton {...args}>Button</TooltipButton>,

    args: {
        tooltipContent: 'Example tooltip',
        isDisabled: true,
    },
};
