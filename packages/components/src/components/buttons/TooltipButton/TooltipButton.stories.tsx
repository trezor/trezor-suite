import { StoryObj } from '@storybook/react';
import { TooltipButton as TooltipButtonComponent } from './TooltipButton';

export default {
    title: 'Buttons/TooltipButton',
    component: TooltipButtonComponent,
};

export const TooltipButton: StoryObj<typeof TooltipButtonComponent> = {
    args: {
        children: 'Button',
        isDisabled: true,
        tooltipContent: 'Example tooltip',
    },
};
