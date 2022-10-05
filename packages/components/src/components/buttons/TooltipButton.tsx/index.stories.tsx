import React from 'react';
import { ComponentStory } from '@storybook/react';
import { TooltipButton } from '.';

export default {
    title: 'Buttons/TooltipButton',
    component: TooltipButton,
};

export const Basic: ComponentStory<typeof TooltipButton> = args => (
    <TooltipButton {...args}>Button</TooltipButton>
);

Basic.args = {
    tooltipContent: 'Example tooltip',
    isDisabled: true,
};
